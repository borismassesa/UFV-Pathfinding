import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Building } from '../../../entities/building.entity';
import { BuildingEntrance } from '../../../entities/building-entrance.entity';

@Injectable()
export class BuildingService {
  constructor(
    @InjectRepository(Building)
    private readonly buildingRepository: Repository<Building>,
    @InjectRepository(BuildingEntrance)
    private readonly entranceRepository: Repository<BuildingEntrance>,
  ) {}

  async findAll(): Promise<Building[]> {
    return this.buildingRepository.find({
      relations: ['rooms', 'entrances'],
      order: { name: 'ASC' },
    });
  }

  async findById(id: string): Promise<Building> {
    const building = await this.buildingRepository.findOne({
      where: { id },
      relations: ['rooms', 'entrances', 'navigationNodes'],
    });

    if (!building) {
      throw new NotFoundException(`Building with ID ${id} not found`);
    }

    return building;
  }

  async findByCode(code: string): Promise<Building> {
    const building = await this.buildingRepository.findOne({
      where: { code },
      relations: ['rooms', 'entrances'],
    });

    if (!building) {
      throw new NotFoundException(`Building with code ${code} not found`);
    }

    return building;
  }

  async getEntrances(buildingId: string): Promise<BuildingEntrance[]> {
    return this.entranceRepository.find({
      where: { buildingId },
      order: { mainEntrance: 'DESC', accessible: 'DESC' },
    });
  }

  async getMainEntrance(buildingId: string): Promise<BuildingEntrance | null> {
    return this.entranceRepository.findOne({
      where: { buildingId, mainEntrance: true },
    });
  }

  async getAccessibleEntrances(buildingId: string): Promise<BuildingEntrance[]> {
    return this.entranceRepository.find({
      where: { buildingId, accessible: true },
      order: { mainEntrance: 'DESC' },
    });
  }

  async searchBuildings(query: string): Promise<Building[]> {
    return this.buildingRepository
      .createQueryBuilder('building')
      .where('building.name ILIKE :query', { query: `%${query}%` })
      .orWhere('building.code ILIKE :query', { query: `%${query}%` })
      .orWhere('building.campus ILIKE :query', { query: `%${query}%` })
      .orderBy('building.name', 'ASC')
      .getMany();
  }

  async getBuildingsNearLocation(lat: number, lng: number, radiusKm: number = 1): Promise<Building[]> {
    return this.buildingRepository
      .createQueryBuilder('building')
      .where(
        'ST_DWithin(building.location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :radius)',
        { lng, lat, radius: radiusKm * 1000 } // Convert km to meters
      )
      .orderBy(
        'ST_Distance(building.location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography)',
        'ASC'
      )
      .setParameters({ lng, lat })
      .getMany();
  }
}