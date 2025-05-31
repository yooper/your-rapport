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
import { User } from '../../models/schemas/User';
import { getDarkTheme, processNotification } from '../../utilities/loaders';
import { createTheme } from '@mui/material';

function Copyright(props) {
  return (
    <Typography
      variant="body2"
      color="text.secondary"
      align="center"
      {...props}
    >
      {'Copyright Bakerstreet Enterprises © '}
      <Link color="inherit" href="https://osintliar.com/">
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
    async function fetchData() {
      const urlParams = new URL(window.location.href).searchParams;

      if (urlParams.has('authToken') && urlParams.has('license')) {
        try {
          const authToken = urlParams.get('authToken');
          const license = urlParams.get('license');
          const user = new User(authToken, license);
          await user.save();
          await user.verify(true);

          // error license mismatch
          if (license !== user.license) {
            throw new Error('Login failed');
          } else {
            // sign in
            window.location.href = `chrome-extension://${chrome.runtime.id}/app.html`;
          }
        } catch (e) {
          throw new Error('Login failed');
        }
      } else {
        // cannot sign in
      }
    }
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

    const url = `https://services.leadconnectorhq.com/hooks/EBHS0V5aN3PqV3rx1C7x/webhook-trigger/iqSMSLMahJXhlPHNMFkx?email=${email}`;
    try {
      // send the request to reach penguin
      fetch(url)
        .then((response) => response.json())
        .then((data) => {});
      processNotification(
        {
          message: 'Check your email for details.',
          title: 'Authentication Email Sent',
          type: 'success',
        },
        30000
      );
    } catch (e) {
      processNotification({
        title: 'Could Not Connect',
        message: 'The CRM service is unavailable.',
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
            <img src={'/OSINT_LIAR_LOGO.png'} height={'200'} />
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
              <input
                type={'hidden'}
                value={`chrome-extension://${chrome.runtime.id}`}
                name={'ExtensionId'}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
              >
                Sign In
              </Button>
              <Divider />
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
