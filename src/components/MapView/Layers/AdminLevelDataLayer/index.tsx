import moment from 'moment';
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { get } from 'lodash';
import { GeoJSONLayer } from 'react-mapbox-gl';
import * as MapboxGL from 'mapbox-gl';
import {
  AdminLevelDataLayerProps,
  BoundaryLayerProps,
  LayerKey,
} from '../../../../config/types';
import { legendToStops } from '../layer-utils';
import {
  LayerData,
  loadLayerData,
} from '../../../../context/layers/layer-data';
import {
  layerDataSelector,
  mapSelector,
} from '../../../../context/mapStateSlice/selectors';
import { addLayer, removeLayer } from '../../../../context/mapStateSlice';
import { addPopupData } from '../../../../context/tooltipStateSlice';
import { getFeatureInfoPropsData } from '../../utils';
import { useDefaultDate } from '../../../../utils/useDefaultDate';
import {
  getBoundaryLayers,
  getBoundaryLayerSingleton,
  LayerDefinitions,
} from '../../../../config/utils';
import { addNotification } from '../../../../context/notificationStateSlice';
import { isLayerOnView } from '../../../../utils/map-utils';
import { getRoundedData } from '../../../../utils/data-utils';
import { useSafeTranslation } from '../../../../i18n';

function AdminLevelDataLayers({ layer }: { layer: AdminLevelDataLayerProps }) {
  const dispatch = useDispatch();
  const map = useSelector(mapSelector);
  const boundaryId = layer.boundary || getBoundaryLayerSingleton().id;

  const layerData = useSelector(layerDataSelector(layer.id)) as
    | LayerData<AdminLevelDataLayerProps>
    | undefined;
  const { data } = layerData || {};
  const { featureCollection } = data || {};
  const { t } = useSafeTranslation();
  const selectedDate = useDefaultDate(layer.id);

  useEffect(() => {
    // before loading layer check if it has unique boundary?
    const boundaryLayers = getBoundaryLayers();
    const boundaryLayer = LayerDefinitions[
      boundaryId as LayerKey
    ] as BoundaryLayerProps;

    if ('boundary' in layer) {
      if (Object.keys(LayerDefinitions).includes(boundaryId)) {
        boundaryLayers.map(l => dispatch(removeLayer(l)));
        dispatch(addLayer({ ...boundaryLayer, isPrimary: true }));

        // load unique boundary only once
        // to avoid double loading which proven to be performance issue
        if (!isLayerOnView(map, boundaryId)) {
          dispatch(loadLayerData({ layer: boundaryLayer }));
        }
      } else {
        dispatch(
          addNotification({
            message: `Invalid unique boundary: ${boundaryId} for ${layer.id}`,
            type: 'error',
          }),
        );
      }
    }
    if (!featureCollection) {
      dispatch(loadLayerData({ layer }));
    }
  }, [dispatch, featureCollection, layer, boundaryId, map]);

  if (!featureCollection) {
    return null;
  }

  if (!isLayerOnView(map, boundaryId)) {
    return null;
  }

  // We use the legend values from the config to define "intervals".
  const fillPaintData: MapboxGL.FillPaint = {
    'fill-opacity': layer.opacity || 0.3,
    'fill-color': {
      property: 'data',
      stops: legendToStops(layer.legend),
      type: 'interval',
    },
  };

  const selectedDateStr = moment(selectedDate).format('YYYY-MM-DD');

  const { features } = featureCollection;

  const filteredFeatures = layer.dateField
    ? features.filter(feature => {
        const { properties } = feature;
        if (!properties) {
          return false;
        }

        const featureMatchesDate =
          properties[layer.dateField!] === selectedDateStr;

        return featureMatchesDate;
      })
    : features;

  const newFeatureCollection = {
    type: 'FeatureCollection',
    features: filteredFeatures,
  };

  return (
    <GeoJSONLayer
      before={`layer-${boundaryId}-line`}
      id={`layer-${layer.id}`}
      data={newFeatureCollection}
      fillPaint={fillPaintData}
      fillOnClick={async (evt: any) => {
        // by default add `data_field` to the tooltip
        dispatch(
          addPopupData({
            [layer.title]: {
              data: getRoundedData(get(evt.features[0], 'properties.data'), t),
              coordinates: evt.lngLat,
            },
          }),
        );
        // then add feature_info_props as extra fields to the tooltip
        dispatch(
          addPopupData(
            getFeatureInfoPropsData(layer.featureInfoProps || {}, evt),
          ),
        );
      }}
    />
  );
}

export default AdminLevelDataLayers;
