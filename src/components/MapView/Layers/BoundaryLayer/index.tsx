import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { GeoJSONLayer } from 'react-mapbox-gl';
import * as MapboxGL from 'mapbox-gl';
import { showPopup, hidePopup } from '../../../../context/tooltipStateSlice';
import { BoundaryLayerProps, WMSLayerProps } from '../../../../config/types';
import { LayerData } from '../../../../context/layers/layer-data';
import {
  setBoundaryParams,
  AdminBoundaryParams,
} from '../../../../context/datasetStateSlice';

import {
  layerDataSelector,
  layersSelector,
} from '../../../../context/mapStateSlice/selectors';
import { toggleSelectedBoundary } from '../../../../context/mapSelectionLayerStateSlice';
import { isPrimaryBoundaryLayer } from '../../../../config/utils';
import { getFullLocationName } from '../../../../utils/name-utils';

function onToggleHover(cursor: string, targetMap: MapboxGL.Map) {
  // eslint-disable-next-line no-param-reassign, fp/no-mutation
  targetMap.getCanvas().style.cursor = cursor;
}

function BoundaryLayer({ layer }: { layer: BoundaryLayerProps }) {
  const dispatch = useDispatch();
  const selectedLayers = useSelector(layersSelector);

  const boundaryLayer = useSelector(layerDataSelector(layer.id)) as
    | LayerData<BoundaryLayerProps>
    | undefined;
  const { data } = boundaryLayer || {};

  if (!data) {
    return null; // boundary layer hasn't loaded yet. We load it on init inside MapView. We can't load it here since its a dependency of other layers.
  }

  const isPrimaryLayer = isPrimaryBoundaryLayer(layer);

  const onHoverHandler = (evt: any) => {
    dispatch(hidePopup());
    onToggleHover('pointer', evt.target);
    const coordinates = evt.lngLat;
    const locationName = getFullLocationName(
      layer.adminLevelNames,
      evt.features[0],
    );

    const locationLocalName = getFullLocationName(
      layer.adminLevelLocalNames,
      evt.features[0],
    );

    dispatch(showPopup({ coordinates, locationName, locationLocalName }));
  };

  const onClickFunc = (evt: any) => {
    const { properties } = evt.features[0];

    // send the selection to the map selection layer. No-op if selection mode isn't on.
    dispatch(
      toggleSelectedBoundary(evt.features[0].properties[layer.adminCode]),
    );

    const selectedLayerWMS: undefined | WMSLayerProps = selectedLayers.find(
      l => l.type === 'wms',
    ) as WMSLayerProps;

    if (!selectedLayerWMS) {
      return;
    }

    const { serverLayerName, title } = selectedLayerWMS;

    if (!layer.chartData) {
      return;
    }

    const layerChartData = layer.chartData.layers.find(
      l => l.name === serverLayerName,
    );

    if (!layerChartData) {
      return;
    }

    const { levels, url } = layer.chartData;
    const { name, type: chartType } = layerChartData;

    const lowestLevelId = levels[levels.length - 1].id;

    const boundaryProps = levels.reduce(
      (obj, item) => ({
        ...obj,
        [item.id]: {
          code: properties[item.id],
          urlPath: item.path,
          name: properties[item.name],
        },
      }),
      {},
    );

    const adminBoundaryParams: AdminBoundaryParams = {
      title,
      boundaryProps,
      serverParams: { layerName: name, url },
      id: lowestLevelId,
      chartType,
    };

    dispatch(setBoundaryParams(adminBoundaryParams));
  };

  // Only use mouse effects and click effects on the main layer.
  const { fillOnMouseEnter, fillOnMouseLeave, fillOnClick } = isPrimaryLayer
    ? {
        fillOnMouseEnter: onHoverHandler,
        fillOnMouseLeave: (evt: any) => onToggleHover('', evt.target),
        fillOnClick: onClickFunc,
      }
    : {
        fillOnMouseEnter: undefined,
        fillOnMouseLeave: undefined,
        fillOnClick: undefined,
      };

  return (
    <GeoJSONLayer
      id={`layer-${layer.id}`}
      data={data}
      fillPaint={layer.styles.fill}
      linePaint={layer.styles.line}
      fillOnMouseEnter={fillOnMouseEnter}
      fillOnMouseLeave={fillOnMouseLeave}
      fillOnClick={fillOnClick}
    />
  );
}

export default BoundaryLayer;
