import React, { useState, useEffect } from 'react';
import './Search.css';
import TopAppBar from '../../components/TopAppBar';
import { Paper } from '@mui/material';
import SearchDataTable from '../../components/tables/SearchDataTable';
import { getLocalItem } from '../../models/db/local';
import { DISCOVERY_PLUGIN, SELECTOR } from '../../services/constants';
import { hideLoader, showLoader } from '../../utilities/loaders';
import Box from '@mui/material/Box';
import MUIDataTable from 'mui-datatables';


export default function Search() {

  const [selectors, setSelectors] = useState([]);
  const [discoveryPlugins, setDiscoveryPlugins] = useState([])
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {

    async function fetchData(){
      setIsLoading(true);
      showLoader();
      setSelectors(await getLocalItem(SELECTOR) ?? []);
      setDiscoveryPlugins((await getLocalItem(DISCOVERY_PLUGIN) ?? []).filter(d => d.isActive));
      setIsLoading(false);
      hideLoader();
    }
    fetchData()

  }, [])

  if (isLoading) {
    return <div></div>;
  }
  return (
    <div>
      <TopAppBar />
      <Paper>
        <SearchDataTable selectors={selectors} discoveryPlugins={discoveryPlugins}/>
      </Paper>
    </div>
  );
}
