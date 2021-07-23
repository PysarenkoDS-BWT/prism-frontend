import {
  values,
  zipObject,
  assign,
  difference,
  mapValues,
  groupBy,
  keysIn,
  keyBy,
  uniq,
} from 'lodash';
import { Map } from 'mapbox-gl';
import { LayerDefinitions } from '../../config/utils';
import { getExtent } from './Layers/raster-utils';
import { WMSLayerProps, FeatureInfoType } from '../../config/types';
import { ExposedPopulationResult } from '../../utils/analysis-utils';
import { TableData } from '../../context/tableStateSlice';

export const getActiveFeatureInfoLayers = (map: Map): WMSLayerProps[] => {
  const matchStr = 'layer-';
  const layerIds =
    map
      .getStyle()
      .layers?.filter(l => l.id.startsWith(matchStr))
      .map(l => l.id.split(matchStr)[1]) ?? [];

  if (layerIds.length === 0) {
    return [];
  }

  const featureInfoLayers = Object.values(LayerDefinitions).filter(
    l => layerIds.includes(l.id) && l.type === 'wms' && l.featureInfoProps,
  );

  if (featureInfoLayers.length === 0) {
    return [];
  }

  return featureInfoLayers as WMSLayerProps[];
};

export const getFeatureInfoParams = (
  map: Map,
  evt: any,
  date: string,
): FeatureInfoType => {
  const { x, y } = evt.point;
  const bbox = getExtent(map);
  const { clientWidth, clientHeight } = map.getContainer();

  const params = {
    bbox,
    x: Math.floor(x),
    y: Math.floor(y),
    width: clientWidth,
    height: clientHeight,
    time: date,
  };

  return params;
};

export const convertToTableData = (
  result: ExposedPopulationResult,
  groupedBy: string,
) => {
  const {
    key,
    statistic,
    featureCollection: { features },
  } = result;

  const fields = uniq(features.map(f => f.properties && f.properties[key]));

  const featureProperties = features.map(feature => {
    return {
      [groupedBy]: feature.properties?.[groupedBy],
      [key]: feature.properties?.[key],
      [statistic]: feature.properties?.[statistic],
    };
  });
  const rowData = mapValues(groupBy(featureProperties, groupedBy), k => {
    return mapValues(keyBy(k, 'label'), obj => parseInt(obj[statistic], 10));
  });

  const groupedRowData = Object.keys(rowData).map((k, i: number) => {
    return {
      [groupedBy]: i,
      ...rowData[k],
    };
  });

  const groupedRowDataWithAllLabels = groupedRowData.map(row => {
    const labelsWithoutValue = difference(fields, keysIn(row));
    const extras = labelsWithoutValue.map(k => ({ [k]: 0 }));
    return extras.length !== 0 ? assign(row, ...extras) : row;
  });

  const headlessRows = groupedRowDataWithAllLabels.map(row => {
    const total = fields.reduce((acc, o) => row[acc] + row[o]);
    return assign(row, { Total: total });
  });
  const columns = [groupedBy, ...fields, 'Total'];
  const headRow = zipObject(columns, columns);
  const rows = [headRow, ...headlessRows];
  return { columns, rows };
};

export const exportDataTableToCSV = (data: TableData) => {
  const { rows } = data;
  return rows.map(r => values(r)).join('\n');
};

export const downloadToFile = (
  source: { content: string; isUrl: boolean },
  filename: string,
  contentType: string,
) => {
  const link = document.createElement('a');
  const fileType = contentType.split('/')[1];

  link.setAttribute(
    'href',
    source.isUrl
      ? source.content
      : URL.createObjectURL(new Blob([source.content], { type: contentType })),
  );
  link.setAttribute('download', `${filename}.${fileType}`);
  link.click();
};
