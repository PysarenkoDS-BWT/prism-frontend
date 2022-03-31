import { FeatureCollection, Feature } from 'geojson';
import { get, isString } from 'lodash';
import {
  BoundaryLayerProps,
  AdminLevelDataLayerProps,
  LayerKey,
} from '../../config/types';
import type { ThunkApi } from '../store';
import {
  getBoundaryLayerSingleton,
  LayerDefinitions,
} from '../../config/utils';

import { fetchJsonDataList } from '../../utils/server-utils';

import type { LayerData, LayerDataParams, LazyLoader } from './layer-data';
import { layerDataSelector } from '../mapStateSlice/selectors';

export type DataRecord = {
  adminKey: string; // refers to a specific admin boundary feature (cell on map). Could be several based off admin level
  value: string | number | null;
};

export type AdminLevelDataLayerData = {
  featureCollection: FeatureCollection;
  layerData: DataRecord[];
};

export const fetchAdminLevelDataLayerData: LazyLoader<AdminLevelDataLayerProps> = () => async (
  { layer }: LayerDataParams<AdminLevelDataLayerProps>,
  api: ThunkApi,
) => {
  const {
    path,
    adminCode,
    dataField,
    featureInfoProps,
    boundary,
    dateField,
  } = layer;
  const { getState } = api;

  // check unique boundary layer presence into this layer
  // use the boundary once available or
  // use the default boundary singleton instead
  const adminBoundaryLayer =
    boundary !== undefined
      ? (LayerDefinitions[boundary as LayerKey] as BoundaryLayerProps)
      : getBoundaryLayerSingleton();

  const adminBoundariesLayer = layerDataSelector(adminBoundaryLayer.id)(
    getState(),
  ) as LayerData<BoundaryLayerProps> | undefined;
  if (!adminBoundariesLayer || !adminBoundariesLayer.data) {
    // TODO we are assuming here it's already loaded. In the future if layers can be preloaded like boundary this will break.
    throw new Error('Boundary Layer not loaded!');
  }
  const adminBoundaries = adminBoundariesLayer.data;

  const rawJSONs = await fetchJsonDataList(path);

  const layerData = (rawJSONs || [])
    .map(point => {
      const adminKey = point[adminCode] as string;
      if (!adminKey) {
        return undefined;
      }
      const value = get(point, dataField);
      const featureInfoPropsValues = Object.keys(featureInfoProps || {}).reduce(
        (obj, item) => {
          return {
            ...obj,
            [item]: point[item],
          };
        },
        {},
      );

      const dateObj = dateField ? { [dateField]: point[dateField] } : {};

      return { adminKey, value, ...featureInfoPropsValues, ...dateObj };
    })
    .filter((v): v is DataRecord => v !== undefined);

  const features = adminBoundaries.features.reduce(
    (acc: Feature[], feature: Feature) => {
      const { properties } = feature;
      const adminBoundaryCode = get(properties, adminCode);
      const matches = layerData.filter(
        ({ adminKey }) => adminBoundaryCode === adminKey,
      );

      if (matches.length === 0) {
        return acc;
      }

      const featureMatches = matches.map(match => ({
        ...feature,
        properties: {
          ...properties,
          ...match,
          data: isString(match.value) ? parseFloat(match.value) : match.value,
        },
      }));

      return [...acc, ...featureMatches];
    },
    [],
  );

  const featureCollection: FeatureCollection = {
    type: 'FeatureCollection',
    features,
  };

  return {
    featureCollection,
    layerData,
  };
};
