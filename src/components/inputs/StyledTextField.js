import styled from "@emotion/styled";
import TextField from "@mui/material/TextField";

export const StyledTextField = styled(TextField)({
    "& .MuiInputLabel-root": {color: '#ffe88b', m:1},
    "& .MuiOutlinedInput-root": {
      "& > fieldset": { borderColor: "#ffe88b" },
    width: 300,
    cursor: 'pointer'
    }
});

export const StyledTextFieldNoWidth = styled(TextField)({
    "& .MuiInputLabel-root": {color: '#ffe88b', m:1},
    "& .MuiOutlinedInput-root": {
      "& > fieldset": { borderColor: "#ffe88b" },
    cursor: 'pointer'
    }
});


