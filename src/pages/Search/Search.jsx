import React, { useState, useEffect } from 'react';
import './Search.css';
import TopAppBar from '../../components/TopAppBar';
import { Paper } from '@mui/material';
import SearchDataTable from '../../components/tables/SearchDataTable';

import { hideLoader, showLoader } from '../../utilities/loaders';

export default function Search() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      showLoader();
      setIsLoading(false);
      hideLoader();
    }
    fetchData();
  }, []);

  if (isLoading) {
    return <div></div>;
  }
  return (
    <div>
      <TopAppBar />
      <Paper>
        <SearchDataTable />
      </Paper>
    </div>
  );
}
