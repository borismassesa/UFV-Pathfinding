#!/usr/bin/env python3
"""
UFV Pathfinding - Shapefile Processing Script

This script processes the BuildingTRooms shapefile to extract room geometries,
calculate centroids, and prepare data for the navigation graph generation.

Usage:
    python process_shapefiles.py [--config CONFIG_FILE] [--input INPUT_DIR] [--output OUTPUT_DIR]
"""

import os
import sys
import json
import yaml
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass, asdict

import click
import geopandas as gpd
import pandas as pd
from shapely.geometry import Point, Polygon, MultiPolygon
from shapely.ops import transform
from loguru import logger
import numpy as np
from tqdm import tqdm

# Add project root to path for imports
sys.path.append(str(Path(__file__).parent.parent.parent))

@dataclass
class RoomData:
    """Data class for room information"""
    room_id: str
    room_number: Optional[str]
    room_name: Optional[str]
    building_id: str
    floor_level: int
    room_type: str
    area_sqm: float
    centroid_x: float
    centroid_y: float
    is_accessible: bool
    geometry: str  # WKT format
    attributes: Dict[str, Any]

class ShapefileProcessor:
    """Main class for processing UFV building shapefiles"""
    
    def __init__(self, config_path: str = "config/processing_config.yaml"):
        """Initialize the processor with configuration"""
        self.config = self._load_config(config_path)
        self._setup_logging()
        self.processed_rooms: List[RoomData] = []
        
    def _load_config(self, config_path: str) -> Dict[str, Any]:
        """Load processing configuration from YAML file"""
        config_file = Path(__file__).parent.parent / config_path
        
        if not config_file.exists():
            raise FileNotFoundError(f"Configuration file not found: {config_file}")
            
        with open(config_file, 'r') as f:
            config = yaml.safe_load(f)
            
        # Expand environment variables
        config = self._expand_env_vars(config)
        return config
    
    def _expand_env_vars(self, obj: Any) -> Any:
        """Recursively expand environment variables in configuration"""
        if isinstance(obj, dict):
            return {k: self._expand_env_vars(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [self._expand_env_vars(item) for item in obj]
        elif isinstance(obj, str) and obj.startswith("${") and obj.endswith("}"):
            # Extract env var with default value
            env_expr = obj[2:-1]  # Remove ${ and }
            if ":" in env_expr:
                var_name, default_value = env_expr.split(":", 1)
                return os.getenv(var_name, default_value)
            else:
                return os.getenv(env_expr, "")
        else:
            return obj
    
    def _setup_logging(self):
        """Configure logging based on config settings"""
        log_config = self.config.get('logging', {})
        log_level = log_config.get('level', 'INFO')
        log_format = log_config.get('format', "{time} | {level} | {message}")
        log_file = log_config.get('file')
        
        # Remove default logger
        logger.remove()
        
        # Add console logger
        logger.add(sys.stdout, level=log_level, format=log_format)
        
        # Add file logger if specified
        if log_file:
            log_path = Path(log_file)
            log_path.parent.mkdir(parents=True, exist_ok=True)
            logger.add(log_file, level=log_level, format=log_format, rotation="10 MB")
    
    def process_building_rooms(self, input_dir: Optional[str] = None) -> List[RoomData]:
        """Process the BuildingTRooms shapefile"""
        
        # Determine input directory
        if input_dir is None:
            input_dir = self.config['input']['shapefiles_dir']
        
        input_path = Path(input_dir)
        shapefile_name = self.config['input']['building_rooms_file']
        shapefile_path = input_path / f"{shapefile_name}.shp"
        
        if not shapefile_path.exists():
            raise FileNotFoundError(f"Shapefile not found: {shapefile_path}")
        
        logger.info(f"Processing shapefile: {shapefile_path}")
        
        # Read shapefile
        try:
            gdf = gpd.read_file(shapefile_path)
            logger.info(f"Loaded {len(gdf)} features from shapefile")
            
            # Log shapefile info
            logger.info(f"CRS: {gdf.crs}")
            logger.info(f"Columns: {list(gdf.columns)}")
            logger.info(f"Geometry types: {gdf.geometry.type.value_counts().to_dict()}")
            
        except Exception as e:
            logger.error(f"Failed to read shapefile: {e}")
            raise
        
        # Process each room
        processed_rooms = []
        
        for idx, row in tqdm(gdf.iterrows(), total=len(gdf), desc="Processing rooms"):
            try:
                room_data = self._process_room_feature(row, idx)
                if room_data:
                    processed_rooms.append(room_data)
            except Exception as e:
                logger.warning(f"Failed to process room at index {idx}: {e}")
                continue
        
        logger.info(f"Successfully processed {len(processed_rooms)} rooms")
        self.processed_rooms = processed_rooms
        return processed_rooms
    
    def _process_room_feature(self, row: pd.Series, feature_idx: int) -> Optional[RoomData]:
        """Process a single room feature from the shapefile"""
        
        # Extract geometry
        geometry = row.geometry
        if geometry is None or geometry.is_empty:
            logger.warning(f"Empty geometry at index {feature_idx}")
            return None
        
        # Validate geometry
        if not geometry.is_valid:
            logger.warning(f"Invalid geometry at index {feature_idx}, attempting to fix...")
            geometry = geometry.buffer(0)  # Common fix for invalid geometries
            
            if not geometry.is_valid:
                logger.warning(f"Could not fix geometry at index {feature_idx}")
                return None
        
        # Calculate area
        area_sqm = geometry.area
        
        # Filter by minimum area
        min_area = self.config['processing']['min_room_area']
        if area_sqm < min_area:
            logger.debug(f"Skipping room at index {feature_idx}: area {area_sqm:.2f} < {min_area}")
            return None
        
        # Calculate centroid
        centroid = geometry.centroid
        
        # Extract attributes (adjust field names based on your shapefile)
        room_attributes = self._extract_room_attributes(row)
        
        # Generate room ID
        room_id = self._generate_room_id(room_attributes, feature_idx)
        
        # Determine accessibility (based on available attributes)
        is_accessible = self._determine_accessibility(row, geometry)
        
        # Create room data object
        room_data = RoomData(
            room_id=room_id,
            room_number=room_attributes.get('room_number'),
            room_name=room_attributes.get('room_name'),
            building_id=room_attributes.get('building_id', 'BUILDING_T'),  # Default to Building T
            floor_level=room_attributes.get('floor_level', 1),  # Default to floor 1
            room_type=room_attributes.get('room_type', 'unknown'),
            area_sqm=area_sqm,
            centroid_x=centroid.x,
            centroid_y=centroid.y,
            is_accessible=is_accessible,
            geometry=geometry.wkt,
            attributes=room_attributes
        )
        
        return room_data
    
    def _extract_room_attributes(self, row: pd.Series) -> Dict[str, Any]:
        """Extract and standardize room attributes from shapefile row"""
        
        # Common shapefile field name mappings
        field_mappings = {
            'room_number': ['ROOM_NUM', 'ROOM_NO', 'Room_Num', 'RoomNumber', 'room_num'],
            'room_name': ['ROOM_NAME', 'Room_Name', 'RoomName', 'NAME', 'room_name'],
            'building_id': ['BUILDING', 'Building', 'BLDG', 'building_id'],
            'floor_level': ['FLOOR', 'Floor', 'LEVEL', 'Level', 'floor_level'],
            'room_type': ['TYPE', 'Type', 'ROOM_TYPE', 'Room_Type', 'room_type'],
            'department': ['DEPT', 'Department', 'DEPARTMENT', 'dept'],
            'capacity': ['CAPACITY', 'Capacity', 'capacity'],
        }
        
        attributes = {}
        
        # Extract attributes using field mappings
        for attr_name, possible_fields in field_mappings.items():
            for field in possible_fields:
                if field in row.index and pd.notna(row[field]):
                    attributes[attr_name] = row[field]
                    break
        
        # Add all other non-geometry fields as additional attributes
        for field in row.index:
            if field != 'geometry' and field not in [f for fields in field_mappings.values() for f in fields]:
                if pd.notna(row[field]):
                    attributes[f'raw_{field}'] = row[field]
        
        return attributes
    
    def _generate_room_id(self, attributes: Dict[str, Any], feature_idx: int) -> str:
        """Generate a unique room ID"""
        
        building_id = attributes.get('building_id', 'T')
        floor_level = attributes.get('floor_level', 1)
        room_number = attributes.get('room_number', f'R{feature_idx:04d}')
        
        return f"{building_id}_{floor_level}_{room_number}"
    
    def _determine_accessibility(self, row: pd.Series, geometry) -> bool:
        """Determine if a room is accessible based on available data"""
        
        # Check for explicit accessibility fields
        accessibility_fields = ['ACCESSIBLE', 'ADA', 'WHEELCHAIR', 'accessible']
        
        for field in accessibility_fields:
            if field in row.index and pd.notna(row[field]):
                value = str(row[field]).lower()
                if value in ['true', '1', 'yes', 'y']:
                    return True
                elif value in ['false', '0', 'no', 'n']:
                    return False
        
        # Default assumption: rooms are accessible unless specified otherwise
        # This can be refined based on actual shapefile data
        return True
    
    def validate_processed_data(self) -> Dict[str, Any]:
        """Validate the processed room data"""
        
        if not self.processed_rooms:
            raise ValueError("No processed rooms to validate")
        
        validation_results = {
            'total_rooms': len(self.processed_rooms),
            'buildings': {},
            'floors': {},
            'room_types': {},
            'accessibility': {'accessible': 0, 'not_accessible': 0},
            'area_stats': {},
            'validation_errors': []
        }
        
        # Collect statistics
        areas = []
        for room in self.processed_rooms:
            # Building stats
            building_id = room.building_id
            if building_id not in validation_results['buildings']:
                validation_results['buildings'][building_id] = 0
            validation_results['buildings'][building_id] += 1
            
            # Floor stats
            floor_key = f"{building_id}_F{room.floor_level}"
            if floor_key not in validation_results['floors']:
                validation_results['floors'][floor_key] = 0
            validation_results['floors'][floor_key] += 1
            
            # Room type stats
            room_type = room.room_type
            if room_type not in validation_results['room_types']:
                validation_results['room_types'][room_type] = 0
            validation_results['room_types'][room_type] += 1
            
            # Accessibility stats
            if room.is_accessible:
                validation_results['accessibility']['accessible'] += 1
            else:
                validation_results['accessibility']['not_accessible'] += 1
            
            areas.append(room.area_sqm)
        
        # Area statistics
        validation_results['area_stats'] = {
            'min_area': min(areas),
            'max_area': max(areas),
            'mean_area': np.mean(areas),
            'median_area': np.median(areas),
            'total_area': sum(areas)
        }
        
        # Validate against thresholds
        thresholds = self.config['validation']['data_quality_thresholds']
        
        for building_id, room_count in validation_results['buildings'].items():
            if room_count < thresholds['min_rooms_per_building']:
                validation_results['validation_errors'].append(
                    f"Building {building_id} has only {room_count} rooms "
                    f"(minimum: {thresholds['min_rooms_per_building']})"
                )
        
        logger.info("Validation Results:")
        logger.info(f"  Total rooms: {validation_results['total_rooms']}")
        logger.info(f"  Buildings: {len(validation_results['buildings'])}")
        logger.info(f"  Floors: {len(validation_results['floors'])}")
        logger.info(f"  Room types: {len(validation_results['room_types'])}")
        logger.info(f"  Accessible rooms: {validation_results['accessibility']['accessible']}")
        logger.info(f"  Average area: {validation_results['area_stats']['mean_area']:.2f} sqm")
        
        if validation_results['validation_errors']:
            logger.warning(f"Validation errors found: {len(validation_results['validation_errors'])}")
            for error in validation_results['validation_errors']:
                logger.warning(f"  - {error}")
        
        return validation_results
    
    def export_to_geojson(self, output_dir: Optional[str] = None) -> str:
        """Export processed rooms to GeoJSON format"""
        
        if not self.processed_rooms:
            raise ValueError("No processed rooms to export")
        
        # Determine output directory
        if output_dir is None:
            output_dir = self.config['output']['geojson_dir']
        
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        # Convert to GeoDataFrame
        features = []
        for room in self.processed_rooms:
            feature = {
                'geometry': room.geometry,
                'properties': {
                    'room_id': room.room_id,
                    'room_number': room.room_number,
                    'room_name': room.room_name,
                    'building_id': room.building_id,
                    'floor_level': room.floor_level,
                    'room_type': room.room_type,
                    'area_sqm': room.area_sqm,
                    'centroid_x': room.centroid_x,
                    'centroid_y': room.centroid_y,
                    'is_accessible': room.is_accessible,
                    **room.attributes
                }
            }
            features.append(feature)
        
        # Create GeoDataFrame
        gdf = gpd.GeoDataFrame.from_features(features)
        
        # Export to GeoJSON
        output_file = output_path / "processed_rooms.geojson"
        gdf.to_file(output_file, driver='GeoJSON')
        
        logger.info(f"Exported {len(features)} rooms to: {output_file}")
        return str(output_file)
    
    def export_to_json(self, output_dir: Optional[str] = None) -> str:
        """Export processed rooms to JSON format for API consumption"""
        
        if not self.processed_rooms:
            raise ValueError("No processed rooms to export")
        
        # Determine output directory
        if output_dir is None:
            output_dir = self.config['output']['processed_dir']
        
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        # Convert to JSON-serializable format
        rooms_data = []
        for room in self.processed_rooms:
            room_dict = asdict(room)
            rooms_data.append(room_dict)
        
        # Export to JSON
        output_file = output_path / "processed_rooms.json"
        with open(output_file, 'w') as f:
            json.dump(rooms_data, f, indent=2, default=str)
        
        logger.info(f"Exported {len(rooms_data)} rooms to: {output_file}")
        return str(output_file)

@click.command()
@click.option('--config', '-c', default='config/processing_config.yaml', help='Configuration file path')
@click.option('--input', '-i', help='Input directory containing shapefiles')
@click.option('--output', '-o', help='Output directory for processed data')
@click.option('--validate', is_flag=True, help='Run validation after processing')
@click.option('--export-geojson', is_flag=True, help='Export to GeoJSON format')
@click.option('--export-json', is_flag=True, help='Export to JSON format')
def main(config: str, input: Optional[str], output: Optional[str], 
         validate: bool, export_geojson: bool, export_json: bool):
    """Process UFV building shapefiles for pathfinding system"""
    
    try:
        # Initialize processor
        processor = ShapefileProcessor(config)
        
        # Process shapefiles
        logger.info("Starting shapefile processing...")
        processed_rooms = processor.process_building_rooms(input)
        
        if not processed_rooms:
            logger.error("No rooms were processed successfully")
            return
        
        # Validate data
        if validate:
            logger.info("Running data validation...")
            validation_results = processor.validate_processed_data()
            
            # Export validation results
            if output:
                validation_path = Path(output) / "validation_results.json"
            else:
                validation_path = Path(processor.config['output']['validation_dir']) / "validation_results.json"
            
            validation_path.parent.mkdir(parents=True, exist_ok=True)
            with open(validation_path, 'w') as f:
                json.dump(validation_results, f, indent=2, default=str)
            
            logger.info(f"Validation results saved to: {validation_path}")
        
        # Export data
        if export_geojson:
            logger.info("Exporting to GeoJSON...")
            geojson_file = processor.export_to_geojson(output)
        
        if export_json:
            logger.info("Exporting to JSON...")
            json_file = processor.export_to_json(output)
        
        logger.info("Processing completed successfully!")
        
    except Exception as e:
        logger.error(f"Processing failed: {e}")
        raise

if __name__ == "__main__":
    main() 