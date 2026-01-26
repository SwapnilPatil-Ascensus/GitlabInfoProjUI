/**
 * SearchFilter component - Provides search and filter functionality
 */
import { useState, useMemo, useEffect } from 'react';
import { TextField, InputAdornment, Box, Chip } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import IconButton from '@mui/material/IconButton';

export default function SearchFilter({ data, onFiltered, searchFields = [], placeholder = 'Search...' }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = useMemo(() => {
    if (!searchTerm || !data || !Array.isArray(data)) return data;
    
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

  // Notify parent of filtered data
  useEffect(() => {
    if (onFiltered && data && Array.isArray(data)) {
      // Always pass the filtered data (which equals original data when no search term)
      onFiltered(filteredData);
    }
  }, [filteredData, onFiltered, data]);

  const handleClear = () => {
    setSearchTerm('');
  };

  return (
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
              <IconButton size="small" onClick={handleClear} edge="end">
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
      {searchTerm && (
        <Box sx={{ mt: 1 }}>
          <Chip 
            label={`${filteredData?.length || 0} results`} 
            size="small" 
            color="primary"
            variant="outlined"
          />
        </Box>
      )}
    </Box>
  );
}

// Helper function to get nested object values
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, prop) => {
    return current && current[prop] !== undefined ? current[prop] : null;
  }, obj);
}
