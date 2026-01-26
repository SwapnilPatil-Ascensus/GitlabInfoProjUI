/**
 * SearchFilter component - Provides search and filter functionality
 * Always visible, dynamically filters, clears to show original list
 */
import { useState, useMemo, useEffect } from 'react';
import { TextField, InputAdornment, Box, Chip, Fade } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import IconButton from '@mui/material/IconButton';

export default function SearchFilter({ data, onFiltered, searchFields = [], placeholder = 'Search...' }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = useMemo(() => {
    if (!searchTerm || !data || !Array.isArray(data)) {
      // No search term - return original data
      return data;
    }
    
    const term = searchTerm.toLowerCase();
    return data.filter(item => {
      if (searchFields.length === 0) {
        // Search all string fields
        return Object.values(item).some(value => {
          if (typeof value === 'string') {
            return value.toLowerCase().includes(term);
          }
          if (typeof value === 'object' && value !== null) {
            return Object.values(value).some(v => 
              typeof v === 'string' && v.toLowerCase().includes(term)
            );
          }
          return false;
        });
      }
      
      // Search specific fields
      return searchFields.some(field => {
        const value = getNestedValue(item, field);
        return value && String(value).toLowerCase().includes(term);
      });
    });
  }, [data, searchTerm, searchFields]);

  // Notify parent of filtered data - always called, even when empty
  useEffect(() => {
    if (onFiltered && data && Array.isArray(data)) {
      // Always pass the filtered data (which equals original data when no search term)
      onFiltered(filteredData || []);
    }
  }, [filteredData, onFiltered, data]);

  const handleClear = () => {
    setSearchTerm('');
    // Clearing will automatically restore original data via useEffect
  };

  // Always show search if we have data (even if filtered results are empty)
  if (!data || !Array.isArray(data) || data.length === 0) {
    return null;
  }

  const hasResults = filteredData && filteredData.length > 0;
  const isFiltered = searchTerm.length > 0;

  return (
    <Fade in={true} timeout={300}>
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton 
                  size="small" 
                  onClick={handleClear} 
                  edge="end"
                  title="Clear search"
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              backgroundColor: 'background.paper',
            },
          }}
        />
        {isFiltered && (
          <Fade in={isFiltered} timeout={200}>
            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip 
                label={`${filteredData?.length || 0} of ${data.length} results`} 
                size="small" 
                color={hasResults ? 'primary' : 'default'}
                variant="outlined"
              />
              {!hasResults && (
                <Chip 
                  label="No matches found" 
                  size="small" 
                  color="warning"
                  variant="outlined"
                />
              )}
            </Box>
          </Fade>
        )}
      </Box>
    </Fade>
  );
}

// Helper function to get nested object values
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, prop) => {
    return current && current[prop] !== undefined ? current[prop] : null;
  }, obj);
}
