/*
 * @license
 * @Copyright Baker Street Enterprises LLC
 * All rights reserved. Copying, distributing or modifying of software is prohibited.
 * Please contact support@bakerstreet.llc for assistance
 */

import * as React from 'react';
import { Fragment, useEffect, useState } from 'react';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Link from '@mui/material/Link';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import { ThemeProvider } from '@mui/material/styles';
import { createRoot } from 'react-dom/client';
import { ReactNotifications } from 'react-notifications-component';
import Mustache from 'mustache/mustache.mjs';
import 'react-notifications-component/dist/theme.css';
import Divider from '@mui/material/Divider';
import { getUser, User } from '../../models/schemas/User';
import { createTab, getDarkTheme, processNotification } from '../../utilities/loaders';
import { createTheme, Tooltip } from '@mui/material';
import { initExtensionPage } from '../../services/init_services';


initExtensionPage();

function Copyright(props) {
  return (
    <Typography
      variant="body2"
      color="text.secondary"
      align="center"
      {...props}
    >
      {'Copyright Bakerstreet Enterprises © '}
      <Link color="inherit" href="https://bakerstreet.llc/">
        Your Rapport
      </Link>{' '}
      {new Date().getFullYear()}
      {'.'}
    </Typography>
  );
}

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');

  Mustache.escape = function (text) {
    return text;
  };

  const validateEmail = (email) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  useEffect(() => {
    async function fetchAccessToken() {
      const urlParams = new URL(window.location.href).searchParams;
      if (urlParams.has('accessToken')) {
        try {
          const accessToken = urlParams.get('accessToken');
          const user = new User(accessToken);
          await user.save();
          if(await user.verify()){
            window.location.href = `chrome-extension://${chrome.runtime.id}/search.html`;
          }
          else{
            processNotification({
              title:'Authentication Failed',
              message: 'The authentication token is no longer valid. Re-sign in or purchase a subscription.',
              type: 'danger'
            })
          }
        } catch (e) {
            processNotification({
              title:'Authentication Failed',
              message: 'The authentication server is inaccessible',
              type: 'danger'
            })
        }
      }
      else if(urlParams.has('logout')){
        const user = await getUser();
        await user.delete();
        window.location.replace(`chrome-extension://${chrome.runtime.id}/login.html`);
      }
    }
    fetchAccessToken();
  }, []);

  /**
   * This only processes the sign in
   * @param event
   * @returns {Promise<void>}
   */
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateEmail(email)) {
      processNotification({
        title: 'Valid Email Required',
        message: 'You must supply a valid email',
        type: 'danger',
      });
      return;
    }

    const url = `https://bakerstreet.llc/wp-json/yr/v1/authenticate?email=${email}`;
    try {
      // send the request to reach penguin
      const response = await fetch(url);
      processNotification(
        {
          message: 'Check your email for details. Check your spam folder too.',
          title: 'Authentication Email Sent',
          type: 'success',
        },
        30000
      );
    } catch (e) {
      processNotification({
        title: 'Could Not Connect',
        message: 'The authentication service is unavailable.',
        type: 'danger',
      });
    }
  };

  return (
    <ThemeProvider theme={createTheme(getDarkTheme())}>
      <CssBaseline />
      <Container component="main" maxWidth="xl" sx={{ minWidth: 580 }}>
        <Fragment>
          <Box
            sx={{
              marginTop: 8,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <ReactNotifications />
            <Tooltip title={'Sign in to gain access to features that are only available in the Pro Version.'}>
              <img src={'icon-128.png'} height={'200'} />
            </Tooltip>
            <Typography component="h1" variant="h5">
              Sign in
            </Typography>
            <Box
              component="form"
              onSubmit={(evt) => handleSubmit(evt)}
              noValidate
              sx={{ mt: 1 }}
            >
              <TextField
                margin="normal"
                required
                fullWidth
                id="Email"
                testid={'Email'}
                label="Email Address"
                name="Email"
                autoComplete="email"
                autoFocus
                onChange={(event) => {
                  setEmail(event.target.value);
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                color='primary'
                sx={{ mt: 3, mb: 2 }}
              >
                Sign In
              </Button>
              <Divider />

              <Button
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                onClick={() => { createTab('https://buy.stripe.com/4gM5kDbRcgWW8d7gLedAk00')}}
                color={'info'}
              >
                Buy a Pro License
              </Button>

            </Box>
          </Box>
        </Fragment>
        <Copyright sx={{ mt: 8, mb: 4 }} />
      </Container>
    </ThemeProvider>
  );
}

const container = document.getElementById('app-container');
const root = createRoot(container);
root.render(<Login />);
