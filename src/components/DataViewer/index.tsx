import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  createStyles,
  Theme,
  Grid,
  Paper,
  WithStyles,
  withStyles,
  IconButton,
  Button,
  CircularProgress,
} from '@material-ui/core';
import { Close } from '@material-ui/icons';
import {
  datasetSelector,
  loadingDatasetSelector,
  clearDataset,
  loadDataset,
  updateAdminId,
} from '../../context/datasetStateSlice';
import { dateRangeSelector } from '../../context/mapStateSlice/selectors';
import Chart from '../DataDrawer/Chart';
import { ChartConfig } from '../../config/types';
import { useSafeTranslation } from '../../i18n';

function DataViewer({ classes }: DatasetProps) {
  const dispatch = useDispatch();
  const isDatasetLoading = useSelector(loadingDatasetSelector);
  const { startDate: selectedDate } = useSelector(dateRangeSelector);
  const { t } = useSafeTranslation();

  const {
    data: dataset,
    adminBoundaryParams: params,
    title,
    chartType,
  } = useSelector(datasetSelector);

  useEffect(() => {
    if (params && selectedDate) {
      const { id, boundaryProps, url, serverLayerName } = params;

      dispatch(
        loadDataset({
          id,
          boundaryProps,
          url,
          serverLayerName,
          selectedDate,
        }),
      );
    }
  }, [params, dispatch, selectedDate]);

  if (!dataset) {
    return null;
  }

  const config: ChartConfig = {
    type: chartType,
    stacked: false,
    fill: false,
    category: params ? params.id : 'N/A',
  };

  const adminBoundaryLevelButtons = params
    ? Object.entries(params.boundaryProps).map(([adminId, level]) => (
        <Button
          id={adminId}
          className={classes.adminButton}
          onClick={() => dispatch(updateAdminId(adminId))}
          size="small"
          color="primary"
          variant={params.id === adminId ? 'contained' : 'text'}
        >
          {level.name}
        </Button>
      ))
    : null;

  return (
    <>
      <Grid item className={classes.container}>
        <Paper className={classes.paper}>
          <IconButton size="small" onClick={() => dispatch(clearDataset())}>
            <Close fontSize="small" />
          </IconButton>
          <Grid item className={classes.boundarySelector}>
            {adminBoundaryLevelButtons}
          </Grid>
          {isDatasetLoading ? (
            <div className={classes.loading}>
              <CircularProgress size={50} />
            </div>
          ) : (
            <Chart title={t(title)} config={config} data={dataset} />
          )}
        </Paper>
      </Grid>
    </>
  );
}

const styles = (theme: Theme) =>
  createStyles({
    container: {
      textAlign: 'right',
      marginTop: 8,
      zIndex: 9999,
    },
    boundarySelector: {
      display: 'flex',
    },
    adminButton: {
      marginRight: '1em',
    },
    paper: {
      padding: 8,
      width: 480,
    },
    title: {
      color: theme.palette.text.secondary,
    },
    loading: {
      height: 240,
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

export interface DatasetProps extends WithStyles<typeof styles> {}

export default withStyles(styles)(DataViewer);
