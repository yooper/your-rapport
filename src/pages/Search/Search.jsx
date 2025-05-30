import React, { useState, useEffect } from 'react';
import './Search.css';
import TopAppBar from '../../components/TopAppBar';
import { Paper } from '@mui/material';
import SearchDataTable from '../../components/tables/SearchDataTable';


export default function Search() {

  return (
    <div>
      <TopAppBar />
      <Paper>
        <SearchDataTable />
      </Paper>
    </div>
  );
}
