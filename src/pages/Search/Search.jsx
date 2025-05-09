import React, {useState, useEffect} from 'react';
import './Search.css';
import TopAppBar from "../../components/TopAppBar";
import {Paper} from "@mui/material";
import SearchDataTable from "../../components/tables/SearchDataTable";
import {showLoader, hideLoader, } from "../../utilities/loaders"
import {getLocalItem} from "../../models/db/local";


export default function Search()
{
    const [rows, setRows] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    // upon render set the last updated time
    localStorage.setItem('lastUpdatedOn', Date.now().toString());

   useEffect(() => {
       async function fetchData(){
           showLoader();
           setIsLoading(true);
           const screenshots = await getLocalItem('screenshots') ?? []
           setRows(screenshots ?? []);
           setIsLoading(false);
           hideLoader();
       }

       fetchData();

       /**
        * Check if any updates occurred
        * TODO: there is a bug in the algorithm
        * @type {number}
        */
       const intervalId = setInterval(async() => {
           let configurationRegistry = await getLocalItem('configuration') ?? {};
           const lastUpdatedOn = parseInt(localStorage.getItem('lastUpdatedOn'))
            if('lastSavedOn' in configurationRegistry &&
                parseInt(configurationRegistry.lastSavedOn) > lastUpdatedOn)
            {
                localStorage.setItem('lastUpdatedOn', configurationRegistry.lastSavedOn);
                await fetchData(); // check for new data every 10 seconds.
            }

       }, 10000); // wait 10 seconds before re-renders
       return () => clearInterval(intervalId);

    }, []);

    return (
        <div>
        <TopAppBar />
        <Paper>
            <SearchDataTable rows={rows} setRows={setRows} isLoading={isLoading}/>
        </Paper>
        </div>
    )
}
