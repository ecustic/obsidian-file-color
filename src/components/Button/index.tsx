import { styled } from 'config/styles';

export const Button = styled('button')({
  display: 'inline-flex',
  justifyContent: 'center',
  alignItems: 'center',

  '.svg-icon + *': {
    marginLeft: '8px',
  },
})