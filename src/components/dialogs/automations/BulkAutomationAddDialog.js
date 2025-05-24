import React, {useState, Fragment, useEffect} from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import {FormControl, TextareaAutosize} from "@mui/material";
import {getLocalItem, setLocalItem} from "../../../models/db/local";
import {processNotification} from "../../../utilities/loaders";
import IconButton from "@mui/material/IconButton";
import LibraryAddIcon from '@mui/icons-material/LibraryAdd';


export default function BulkAutomationAddDialog(props) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [text, setText] = useState('');

  useEffect(() =>
  {
      async function fetchData() {
          setIsLoading(true)
          setOpen(props.open)
          setIsLoading(false)
      }
      fetchData();
  }, [props.open]);

  const handleClose = () => {
    setOpen(false)
  };

  const handleSave = async() => {
    if(text.length > 0 && text.trim().length > 0){
        const urls = text.split('\n');
        const existingUrls = await getLocalItem('bulk_automation') ?? [];

        let automateUrls = urls.map(url =>{
            return {
                uuid: crypto.randomUUID(),
                url: url,
                createdOn: new Date(),
                completedOn: null
            }
        });

        const rows = existingUrls.concat(automateUrls);
        props.setRows(rows);
        await setLocalItem('bulk_automation', rows);
        processNotification({title: 'Bulk Automation', message: `${urls.length} have been added to the bulk automation queue.`, type: 'success'});
    }
    setOpen(false)
  };

  if(isLoading){
      return <div></div>
  }

  return (
    <Fragment>
        <IconButton >
            <LibraryAddIcon onClick={() => setOpen(true)} />
        </IconButton>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="form-dialog-title"
        fullWidth={true}
        maxWidth={'md'}
      >
        <DialogTitle>Bulk Collect Urls</DialogTitle>
        <DialogContent>
              <TextareaAutosize
                style={{ width: "90%" }}
                minRows={10}
                maxRows={100}
                placeholder="Enter your urls to bulk scan, one url per line..."
                name="urls"
                id="urls"
                defaultValue={text}
                onChange={(e) => setText(e.target.value)}
              />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="cancel" variant={'contained'}>
            Cancel
          </Button>
          <Button onClick={handleSave} color="secondary" variant={'contained'}>
            Save
          </Button>

        </DialogActions>
      </Dialog>
    </Fragment>
  );
}
