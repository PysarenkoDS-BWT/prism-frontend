import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  createStyles,
  Theme,
  Grid,
  Paper,
  WithStyles,
  withStyles,
  IconButton,
} from '@material-ui/core';
import { Close } from '@material-ui/icons';
import { DatasetSelector } from '../../../context/chartDataStateSlice';
import Chart from '../../DataDrawer/Chart';
import { ChartConfig } from '../../../config/types';

function DataViewer({ classes }: DatasetProps) {
  const dataset = useSelector(DatasetSelector);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (dataset) {
      setOpen(true);
    }
  }, [dataset]);

  if (!dataset) {
    return null;
  }

  const config: ChartConfig = {
    type: 'line',
    stacked: false,
    fill: false,
    category: 'Admin2_Code',
  };

  return (
    <>
      {open && (
        <Grid item className={classes.container}>
          <Paper className={classes.paper}>
            <IconButton size="small" onClick={() => setOpen(false)}>
              <Close fontSize="small" />
            </IconButton>
            <Chart title="" config={config} data={dataset} />
          </Paper>
        </Grid>
      )}
    </>
  );
}

const styles = (theme: Theme) =>
  createStyles({
    container: {
      textAlign: 'right',
      marginTop: 8,
    },
    paper: {
      padding: 8,
      width: 480,
    },
    title: {
      color: theme.palette.text.secondary,
    },
  });

export interface DatasetProps extends WithStyles<typeof styles> {}

export default withStyles(styles)(DataViewer);
