import * as React from 'react';
import Grid from '@mui/material/Unstable_Grid2';
import {FormControlLabel, Switch} from "@mui/material";
import {useEffect, useState} from "react";
import FormControl from "@mui/material/FormControl";
import InputAdornment from "@mui/material/InputAdornment";
import {hideLoader, showLoader} from "../../utilities/loaders";
import HelperPopover from "../HelperPopover";
import {stringToBoolean} from "../../utilities/transformers";
import {StyledTextField} from "../inputs/StyledTextField";



export default function BrowserSettingsForm(props)
{
  const [config, setConfig] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [fileAccess, setFileAccess] = useState(false)
  const message = `In your browser, go to "chrome://extensions/?id=${chrome.runtime.id}" and enable the "Allow access to file URLs" for this extension to open local MHTML files. This will provide a higher fidelity capture of the web pages.`
  const [genericDialogOpen, setGenericDialogOpen] = useState(false)
  const chromeExtensionId = `chrome://extensions/?id=${chrome.runtime.id}`

  useEffect(() => {
    async function fetchData() {
      showLoader();
      setIsLoading(true);
      hideLoader();
      setIsLoading(false);
    }
    fetchData();
  }, []);

  useEffect(() => {
    async function fetchData() {
      showLoader();
      setIsLoading(true);
      hideLoader();
      setIsLoading(false);
    }
    fetchData();
  }, []);


  const handleSwitchChange = (event) => {
    const boolResult = String(event.target.checked);
    update(event.target.name, boolResult)
  };

  const handleChange = async(event) => {
    await update(event.target.name, event.target.value)
  };

  const update = async(key, value, groupName = 'Configuration', notificationEnabled = true) => {
    setConfig({ ...config, [key]: value });
    // TODO update configuration value

  };

  if(isLoading)
  {
    return(<div></div>)
  }

    return(

      <div>
        <form noValidate>
          <Grid container justifyContent="flex-end" spacing={2}>
            <Grid item xs={12}>
              <FormControlLabel
                disabled={true}
                value="end"
                id={'highlightSelectors'}
                name={'highlightSelectors'}
                control={<Switch color="primary" />}
                label={
                  <div><HelperPopover message={'Highlight the selectors that exist on the page.'} />Highlight Selectors</div>
                }
                labelPlacement="end"
                color={'primary'}
                checked={false}
                onChange={handleSwitchChange}
              />
            </Grid>
          </Grid>
        </form>
      </div>
    )
}