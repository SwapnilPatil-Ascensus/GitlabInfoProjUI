/**
 * InfoTooltip component - Shows information icon with tooltip
 */
import { Tooltip, IconButton } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { styled } from '@mui/material/styles';

const StyledIconButton = styled(IconButton)(({ theme }) => ({
  padding: '4px',
  color: theme.palette.text.secondary,
  '&:hover': {
    color: theme.palette.primary.main,
    backgroundColor: 'transparent',
  },
}));

export default function InfoTooltip({ description, placement = 'top' }) {
  if (!description) return null;
  
  return (
    <Tooltip 
      title={description} 
      arrow 
      placement={placement}
      enterDelay={300}
      leaveDelay={100}
    >
      <StyledIconButton size="small" aria-label="info">
        <InfoIcon fontSize="small" />
      </StyledIconButton>
    </Tooltip>
  );
}
