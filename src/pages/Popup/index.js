/*
 * @license
 * @Copyright Baker Street Enterprises LLC
 * All rights reserved. Copying, distributing or modifying of software is prohibited.
 * Please contact support@bakerstreet.llc for assistance
 */

import React, {Fragment, useEffect, useState} from 'react';
import Popup from './Popup';
import './index.css';
import { ReactNotifications } from 'react-notifications-component'
import 'react-notifications-component/dist/theme.css'
import {createRoot} from "react-dom/client";
import {hideLoader, showLoader} from "../../utilities/loaders";

const PopupAppLoadingScreen = ({ hideLoader, showLoader }) => {

    const [isLoading, setIsLoading] = useState(true)

  useEffect(() =>
  {
      async function fetchData() {
          showLoader()
          setIsLoading(true)
          setIsLoading(false)
          hideLoader()
      }
      fetchData();
  }, []);

    if(isLoading){
        return <div></div>
    }
    return (
    <Fragment>
        <ReactNotifications />
        <Popup />
    </Fragment>

  );
};

const container = document.getElementById('app-container');
const root = createRoot(container);
root.render(
    <PopupAppLoadingScreen hideLoader={hideLoader} showLoader={showLoader}/>
);