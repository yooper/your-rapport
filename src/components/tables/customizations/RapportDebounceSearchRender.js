import React from 'react';
import Grow from '@mui/material/Grow';
import TextField from '@mui/material/TextField';
import ClearIcon from '@mui/icons-material/Clear';
import { withStyles } from 'tss-react/mui';
import Typography from '@mui/material/Typography';
import SearchIcon from '@mui/icons-material/Search';
import InputAdornment from '@mui/material/InputAdornment';


function debounce(func, wait, immediate) {
  let timeout;
  return function() {
    const context = this,
      args = arguments;
    const later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
}

const defaultStyles = theme => ({
  main: {
    display: 'flex',
    flex: '1 0 auto',
    alignItems: 'center',
  },
  searchIcon: {
    color: theme.palette.text.secondary,
    marginRight: '8px',
  },
  searchText: {
    flex: '1.8 0'
  },
  clearIcon: {
    '&:hover': {
      color: theme.palette.error.main,
    },
  },
});

class _DebounceTableSearch extends React.Component {

  handleTextChangeWrapper = debouncedSearch => {
    return function(event) {
      debouncedSearch(event.target.value);
    };
  };

  componentDidMount() {
    document.addEventListener('keydown', this.onKeyDown, false);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.onKeyDown, false);
  }

  onKeyDown = event => {
    if (event.keyCode === 27) {
      this.props.onHide();
    }
  };


  render() {
    const { classes, options, onHide, searchText, debounceWait } = this.props;

    let value = '';
    const debouncedSearch = debounce(value => {
      this.props.onSearch(value);
    }, debounceWait);

    return (
      <Grow appear in={true} timeout={300}>
        <div className={classes.main}>
          <TextField
            id={'search-input-field'}
            variant={'standard'}
            className={classes.searchText}
            autoFocus={true}
            InputProps={{
              'data-test-id': options.textLabels.toolbar.search,
              'aria-label': options.textLabels.toolbar.search,
                startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon className={classes.searchIcon} />
                    </InputAdornment>
                ),
                endAdornment: (
                    <InputAdornment position="end">
                      <ClearIcon className={classes.clearIcon} onClick={() => {
                        const input = document.getElementById('search-input-field');
                        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
                        nativeInputValueSetter.call(input, '');
                        const inputEvent = new Event('input', { bubbles: true});
                        input.dispatchEvent(inputEvent);
                      }}/>
                    </InputAdornment>
                )
            }}
            defaultValue={searchText}
            onChange={this.handleTextChangeWrapper(debouncedSearch)}
            fullWidth={true}
            inputRef={el => (this.searchField = el)}
            placeholder={options.searchPlaceholder}
            {...(options.searchProps ? options.searchProps : {})}
          />
        </div>
      </Grow>
    );
  }
}

const DebounceTableSearch = withStyles(_DebounceTableSearch, defaultStyles, { name: 'MUIDataTableSearch' });
export { DebounceTableSearch };

export function rapportDebounceSearchRender(debounceWait = 300) {
  return (searchText, handleSearch, hideSearch, options) => {
    return (
      <DebounceTableSearch
        searchText={searchText}
        onSearch={handleSearch}
        onHide={hideSearch}
        options={options}
        debounceWait={debounceWait}
      />
    );
  };
}