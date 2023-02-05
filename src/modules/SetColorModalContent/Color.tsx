import { styled } from 'config/styles'

export const Color = styled<{ selected?: boolean; className?: string }>('div')`
  display: block;
  width: 32px;
  height: 32px;
  border-style: solid;
  border-radius: 32px;
  border-color: ${(props) =>
    props.selected ? 'var(--color-base-70)' : 'var(--color-base-40)'};
  background-color: var(--file-color-color);
`
