import React,{ Fragment} from 'react';
import { createRoot } from 'react-dom/client';

import 'react-notifications-component/dist/theme.css'
import { ReactNotifications } from 'react-notifications-component'
import './index.css';
import {createTheme, ThemeProvider} from "@mui/material";
import {getDarkTheme} from "../../utilities/loaders";
import Popup from "./Popup";
import TopAppBar from "../../components/TopAppBar";


function App(){
    return (
    <Fragment>
        <ReactNotifications />
        <Popup/>
    </Fragment>
    )
}

const container = document.getElementById('app-container');
const root = createRoot(container); // createRoot(container!) if you use TypeScript
root.render(
    <ThemeProvider theme={createTheme(getDarkTheme())}>
        <TopAppBar />
        <App/>
    </ThemeProvider>
);
