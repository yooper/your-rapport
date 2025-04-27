import React, {Fragment, useState} from 'react';
import './Options.css';
import TopAppBar from "../../components/TopAppBar";
import {List, ListItem, ListItemButton, ListItemIcon, ListItemText, Paper} from "@mui/material";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Unstable_Grid2";
import SettingsIcon from '@mui/icons-material/Settings';

/**
 * TODO: Implement Options
 * @returns {JSX.Element}
 * @constructor
 */
export default function Options()
{
      const urlParams = new URL(window.location.href).searchParams;
      const [selectedComponent, setSelectedComponent] = useState(urlParams.get('view') ?? 'system')
      const componentMap = [
        { label: 'System Settings', key: 'system', icon: <SettingsIcon /> },
      ]

    return (
        <Fragment>
        <TopAppBar />
        <Paper>
            <Box sx={{ flexGrow: 1 }}>
              <Grid container spacing={2}>
                <Grid xs={2}>
                  <List>
                    {componentMap.map((component, index) => (
                      <ListItem key={component.label} disablePadding onClick={() => setSelectedComponent(component.key) }>
                        <ListItemButton>
                          <ListItemIcon>
                              {component.icon}
                          </ListItemIcon>
                          <ListItemText primary={component.label} />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Grid>
                <Grid xs={10}>
                  <Renderer selectedComponent={selectedComponent} />
                </Grid>
              </Grid>
            </Box>
        </Paper>
        </Fragment>
    )

    function Renderer(props) {
        switch (props.selectedComponent) {
            case 'system':
            //    return <SystemSettingsForm/>
            default:
                return <div>Unknown setting</div>
        }
    }
}
