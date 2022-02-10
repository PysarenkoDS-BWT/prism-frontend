import moment from 'moment';
import { get } from 'lodash';
import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import * as Papa from 'papaparse';
import type { CreateAsyncThunkTypes, RootState } from './store';
import { TableData } from './tableStateSlice';

type DatasetState = {
  data?: TableData;
};

const initialState: DatasetState = {};

export type DatasetParams = {
  id: string;
  filepath: string;
};

export const loadDataset = createAsyncThunk<
  TableData,
  DatasetParams,
  CreateAsyncThunkTypes
>('datasetState/loadDataset', async (params: DatasetParams) => {
  const url = process.env.PUBLIC_URL + params.filepath;

  return new Promise<TableData>((resolve, reject) =>
    Papa.parse(url, {
      header: true,
      download: true,
      complete: results => {
        const row = results.data.find(item => item.Admin2_Code === params.id);

        return resolve({
          rows: [...results.data.slice(0, 1), row],
          columns: Object.keys(row),
        });
      },
      error: error => reject(error),
    }),
  );
});

export const datasetResultStateSlice = createSlice({
  name: 'DatasetResultSlice',
  initialState,
  reducers: {
    addEwsDataset: (
      { ...rest },
      { payload }: PayloadAction<TableData>,
    ): DatasetState => {
      const { rows, columns } = payload;
      const formattedRows = [
        Object.fromEntries(
          Object.keys(rows[0]).map(k => [
            k,
            moment(rows[0][k]).local().format('HH:MM:ss'),
          ]),
        ),
        rows[1],
      ];

      return { ...rest, data: { rows: formattedRows, columns } };
    },
  },
  extraReducers: builder => {
    builder.addCase(
      loadDataset.fulfilled,
      ({ ...rest }, { payload }: PayloadAction<TableData>): DatasetState => ({
        ...rest,
        data: payload,
      }),
    );
  },
});

export const DatasetSelector = (state: RootState): TableData | undefined =>
  state.datasetState.data;

// Setters
export const { addEwsDataset } = datasetResultStateSlice.actions;

export default datasetResultStateSlice.reducer;