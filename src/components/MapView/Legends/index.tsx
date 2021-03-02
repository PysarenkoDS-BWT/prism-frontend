import React, { PropsWithChildren, useState, useEffect } from 'react';
import {
  Box,
  createStyles,
  Divider,
  FormControl,
  Grid,
  Hidden,
  List,
  ListItem,
  MenuItem,
  Paper,
  Select,
  Slider,
  Switch,
  Theme,
  Typography,
  WithStyles,
  withStyles,
  Button,
} from '@material-ui/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

import { useDispatch, useSelector } from 'react-redux';
import { setFormInputValue } from '../../../context/mapStateSlice';
import {
  mapSelector,
  layerFormSelector,
} from '../../../context/mapStateSlice/selectors';
import ColorIndicator from './ColorIndicator';
import { LayerFormInput, LayerType } from '../../../config/types';
import {
  analysisResultSelector,
  isAnalysisLayerActiveSelector,
} from '../../../context/analysisResultStateSlice';

function Legends({ classes, layers }: LegendsProps) {
  const [open, setOpen] = useState(true);
  const analysisResult = useSelector(analysisResultSelector);
  const isAnalysisLayerActive = useSelector(isAnalysisLayerActiveSelector);

  const legendItems = [
    ...layers.map(({ id, title, legend, legendText, type, opacity }) => {
      if (!legend || !legendText) {
        // this layer doesn't have a legend (likely boundary), so lets ignore.
        return null;
      }
      return (
        <LegendItem
          classes={classes}
          key={title}
          id={id}
          title={title}
          legend={legend}
          type={type}
          opacity={opacity}
        >
          {legendText}
        </LegendItem>
      );
    }),
    // add analysis legend item if layer is active and analysis result exists
    ...(isAnalysisLayerActive && analysisResult
      ? [
          <LegendItem
            key={analysisResult.key}
            legend={analysisResult.legend}
            title={`${analysisResult.getBaselineLayer().title} exposed to ${
              analysisResult.getHazardLayer().title
            }`}
            classes={classes}
          >
            Impact Analysis on {analysisResult.getBaselineLayer().legendText}
            <br />
            {analysisResult.threshold.above
              ? `Above Threshold: ${analysisResult.threshold.above}`
              : ''}
            <br />
            {analysisResult.threshold.below
              ? `Below Threshold: ${analysisResult.threshold.below}`
              : ''}
          </LegendItem>,
        ]
      : []),
  ];

  return (
    <Grid item className={classes.container}>
      <Button
        variant="contained"
        color="primary"
        onClick={() => setOpen(!open)}
      >
        <FontAwesomeIcon
          style={{ fontSize: '1.2em' }}
          icon={open ? faEyeSlash : faEye}
        />
        <Hidden smDown>
          <Typography className={classes.label} variant="body2">
            Legend
          </Typography>
        </Hidden>
      </Button>

      {open && <List className={classes.list}>{legendItems}</List>}
    </Grid>
  );
}

// Children here is legendText
function LegendItem({
  classes,
  id,
  title,
  legend,
  type,
  opacity: initialOpacity,
  children,
}: LegendItemProps) {
  const dispatch = useDispatch();
  const map = useSelector(mapSelector);
  const form = useSelector(layerFormSelector(id));
  const [opacity, setOpacityValue] = useState<number | number[]>(
    initialOpacity || 0,
  );

  const [toggle, setToggle] = useState(true);
  const toggleChecked = (prev: Boolean) => {
    setToggle(!prev);
  };

  const handleChangeOpacity = (event: object, newValue: number | number[]) => {
    setOpacityValue(newValue);
  };

  const handleChangeFormInput = (event: any, input: LayerFormInput) => {
    const { value } = event.target;
    dispatch(
      setFormInputValue({
        layerId: id!,
        inputId: input.id,
        value,
      }),
    );
  };

  const layerTypes = ['wms', 'nso', 'point_data', 'impact'];
  const [layerId, opacityType] = (e => {
    switch (e) {
      case 'wms':
        return [`layer-${id}`, 'raster-opacity'];
      case 'impact':
      case 'nso':
        return [`layer-${id}-fill`, 'fill-opacity'];
      case 'point_data':
        return [`layer-${id}-circle`, 'circle-opacity'];
      default:
        return ['', ''];
    }
  })(type);

  const allLayers = map!.getStyle().layers;
  const isAvailable = allLayers!.find(layer => layer.id === layerId);
  useEffect(() => {
    if (!!isAvailable && layerTypes.includes(type!)) {
      map!.setPaintProperty(layerId, opacityType, opacity);
      map!.setLayoutProperty(
        layerId,
        'visibility',
        toggle ? 'visible' : 'none',
      );
    }
  });

  return (
    <ListItem disableGutters dense>
      <Paper className={classes.paper}>
        <Grid container direction="column" spacing={1}>
          <Grid item style={{ display: 'flex' }}>
            <Typography style={{ flexGrow: 1 }} variant="h4">
              {title}
            </Typography>
            {!!isAvailable && layerTypes.includes(type!) && (
              <Switch
                checked={toggle}
                onChange={() => toggleChecked(toggle)}
                color="primary"
                size="small"
                disableRipple
              />
            )}
          </Grid>
          {toggle && (
            <>
              <Divider />
              {!!isAvailable && layerTypes.includes(type!) && (
                <Grid item className={classes.slider}>
                  <Box px={1}>
                    <Slider
                      value={opacity}
                      step={0.01}
                      min={0}
                      max={1}
                      aria-labelledby="opacity-slider"
                      onChange={handleChangeOpacity}
                    />
                  </Box>
                </Grid>
              )}
              {form &&
                form.inputs.map(input => {
                  return (
                    <Grid key={input.id} item>
                      <Typography variant="h4">{input.label}</Typography>
                      <FormControl>
                        <Select
                          className={classes.select}
                          value={input.value}
                          onChange={e => handleChangeFormInput(e, input)}
                        >
                          {input.values.map(v => (
                            <MenuItem key={v.value} value={v.value}>
                              {v.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  );
                })}
              {legend && (
                <Grid item>
                  {legend.map(({ value, color }: any) => (
                    <ColorIndicator
                      key={value}
                      value={value as string}
                      color={color as string}
                      opacity={opacity as number}
                    />
                  ))}
                </Grid>
              )}

              <Divider />

              {children && (
                <Grid item>
                  <Typography variant="h5">{children}</Typography>
                </Grid>
              )}
            </>
          )}
        </Grid>
      </Paper>
    </ListItem>
  );
}

const styles = (theme: Theme) =>
  createStyles({
    container: {
      textAlign: 'right',
    },
    label: {
      marginLeft: '10px',
    },
    list: {
      overflow: 'auto',
      maxHeight: '70vh',
      position: 'absolute',
      right: '16px',
    },
    paper: {
      padding: 8,
      width: 180,
    },
    select: {
      color: '#333',
    },
    slider: {
      padding: '0 5px',
    },
    switch: {
      '&$checked': {
        color: theme.palette.common.white,
        '& + $track': {
          backgroundColor: theme.palette.secondary.dark,
          opacity: 1,
          border: 'none',
        },
      },
    },
  });

export interface LegendsProps extends WithStyles<typeof styles> {
  layers: LayerType[];
}

interface LegendItemProps
  extends WithStyles<typeof styles>,
    PropsWithChildren<{}> {
  id?: LayerType['id'];
  title: LayerType['title'];
  legend: LayerType['legend'];
  type?: LayerType['type'];
  opacity?: LayerType['opacity'];
}

export default withStyles(styles)(Legends);
