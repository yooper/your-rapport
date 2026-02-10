import { styled } from '@mui/material/styles';
import TextField from '@mui/material/TextField';

export const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiInputLabel-root': { color: '#fff', margin: theme.spacing(1) },
  '& .MuiOutlinedInput-root': {
    '& > fieldset': { borderColor: '#fff' },
    width: 300,
    cursor: 'pointer',
  },
}));

export const StyledTextFieldNoWidth = styled(TextField)(({ theme }) => ({
  '& .MuiInputLabel-root': { color: '#fff', margin: theme.spacing(1) },
  '& .MuiOutlinedInput-root': {
    '& > fieldset': { borderColor: '#fff' },
    cursor: 'pointer',
  },
}));
