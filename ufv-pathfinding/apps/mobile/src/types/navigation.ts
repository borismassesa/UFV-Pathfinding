export type RootStackParamList = {
  Home: undefined;
  Navigate: undefined;
  Map: undefined;
  Favorites: undefined;
  Profile: undefined;
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  Settings: undefined;
};

export type HomeStackParamList = {
  HomeMain: undefined;
  RoomDetail: { roomId: string; roomName: string };
};

export type NavigationStackParamList = {
  NavigationMain: undefined;
  RouteDetail: { routeId: string; routeName: string };
};

export type MapStackParamList = {
  MapMain: undefined;
  RoomDetail: { roomId: string; roomName: string };
};

export type FavoritesStackParamList = {
  FavoritesMain: undefined;
  RoomDetail: { roomId: string; roomName: string };
}; 