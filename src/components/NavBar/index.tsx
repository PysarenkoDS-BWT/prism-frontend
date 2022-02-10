import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Grid,
  Hidden,
  Theme,
  withStyles,
  WithStyles,
  createStyles,
  Button,
  Drawer,
} from '@material-ui/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import { faInfoCircle, faBars } from '@fortawesome/free-solid-svg-icons';
import {
  faSearchMinus,
  faSearchPlus,
  faBars,
} from '@fortawesome/free-solid-svg-icons';
// import { faGithub } from '@fortawesome/free-brands-svg-icons';
import LanguageSelect from './LanguageSelect';
import MenuItem from './MenuItem';
import MenuItemMobile from './MenuItemMobile';
import { menuList } from './utils';
// import mosaLogo from '../images/mosa_logo.png';
import wfpLogo from '../images/wfp_logo_small.png';
// import { uiLabel } from '../../config';

// const rightSideLinks = [
//   {
//     title: uiLabel('about', 'About'),
//     icon: faInfoCircle,
//     href: 'https://innovation.wfp.org/project/prism',
//   },
//   {
//     title: 'Github',
//     icon: faGithub,
//     href: 'https://github.com/oviohub/prism-frontend',
//   },
// ];

function NavBar({ classes }: NavBarProps) {
  const [openMobileMenu, setOpenMobileMenu] = useState(false);

  const menu = menuList.map(({ title, ...category }) => (
    <MenuItem key={title} title={title} {...category} />
  ));

  // menu for mobile, 1 active accordion at a time so I put the state in here
  const [expanded, setExpanded] = useState('');
  const selectAccordion = (title: string) => {
    setExpanded(title);
  };
  const menuMobile = menuList.map(({ title, ...category }) => (
    <MenuItemMobile
      expanded={expanded}
      selectAccordion={selectAccordion}
      key={title}
      title={title}
      {...category}
    />
  ));

  // const buttons = rightSideLinks.map(({ title, icon, href }) => (
  //   <Grid item key={title}>
  //     <Typography
  //       variant="body2"
  //       component="a"
  //       target="_blank"
  //       href={href}
  //       onClick={() => setOpenMobileMenu(false)}
  //     >
  //       <FontAwesomeIcon icon={icon} /> {title}
  //     </Typography>
  //   </Grid>
  // ));

  const [zoom, setZoom] = useState(1);

  const changeZoom = (modifier: number) => {
    const z = zoom + modifier;
    setZoom(z);
    // eslint-disable-next-line
    (document.body.style as any).zoom = z;
    window.dispatchEvent(new Event('resize'));
  };

  const zoomButtons = (
    <>
      <Grid item>
        <Typography
          variant="body2"
          style={{ cursor: 'pointer' }}
          onClick={() => changeZoom(-0.1)}
        >
          <FontAwesomeIcon icon={faSearchMinus} />
        </Typography>
      </Grid>
      <Grid item>
        <Typography
          variant="body2"
          style={{ cursor: 'pointer' }}
          onClick={() => changeZoom(+0.1)}
        >
          <FontAwesomeIcon icon={faSearchPlus} />
        </Typography>
      </Grid>
    </>
  );

  return (
    <AppBar position="static" className={classes.appBar}>
      <Toolbar variant="dense">
        <Grid container>
          <Grid item xs={3} className={classes.logoContainer}>
            {/* <img className={classes.orgLogo} src={mosaLogo} alt="logo mosa" /> */}
            <img className={classes.orgLogo} src={wfpLogo} alt="logo wfp" />
            <Typography
              variant="h6"
              className={classes.logo}
              component={Link}
              to="/"
            >
              Prism
            </Typography>
          </Grid>

          <Hidden smDown>
            <Grid className={classes.menuContainer} item xs={6}>
              {menu}
            </Grid>

            <Grid
              spacing={3}
              container
              justify="flex-end"
              alignItems="center"
              item
              xs={3}
            >
              <LanguageSelect key="language" />
              {zoomButtons}
            </Grid>
          </Hidden>

          <Hidden mdUp>
            <Grid item xs={9} className={classes.mobileMenuContainer}>
              <Button
                onClick={() => setOpenMobileMenu(prevOpen => !prevOpen)}
                aria-controls={openMobileMenu ? 'mobile-menu-list' : undefined}
                aria-haspopup="true"
                className={classes.menuBars}
              >
                <FontAwesomeIcon icon={faBars} />
              </Button>

              <Drawer
                anchor="right"
                open={openMobileMenu}
                onClose={() => setOpenMobileMenu(false)}
              >
                <div className={classes.mobileDrawerContent}>
                  <Grid container spacing={3}>
                    <Grid container justify="space-around" item>
                      {zoomButtons}
                    </Grid>
                    <Grid container direction="column" item>
                      {menuMobile}
                    </Grid>
                  </Grid>
                </div>
              </Drawer>
            </Grid>
          </Hidden>
        </Grid>
      </Toolbar>
    </AppBar>
  );
}

const styles = (theme: Theme) =>
  createStyles({
    appBar: {
      backgroundImage: `linear-gradient(180deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
    },

    logoContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    },

    orgLogo: {
      width: 28,
      marginRight: 15,
    },

    logo: {
      letterSpacing: '.3rem',
      fontSize: '1.25rem',
      textTransform: 'uppercase',
      padding: 0,
    },

    menuContainer: {
      textAlign: 'center',
    },

    mobileDrawerContent: {
      backgroundColor: theme.palette.primary.main,
      paddingTop: 16,
      width: '80vw',
      height: '100vh',
      overflowX: 'hidden',
    },

    menuBars: {
      height: '100%',
      fontSize: 20,
      color: theme.palette.text.primary,
    },

    mobileMenuContainer: {
      textAlign: 'right',
    },
  });

export interface NavBarProps extends WithStyles<typeof styles> {}

export default withStyles(styles)(NavBar);
