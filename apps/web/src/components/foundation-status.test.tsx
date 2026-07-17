import { render, screen } from '@testing-library/react';
import { FoundationStatus } from './foundation-status';

describe('FoundationStatus', () => {
  it('renders the supplied status content', () => {
    render(
      <FoundationStatus title="API protegida" description="NestJS com validação centralizada." />,
    );

    expect(screen.getByRole('heading', { name: 'API protegida' })).toBeInTheDocument();
    expect(screen.getByText('NestJS com validação centralizada.')).toBeInTheDocument();
  });
});
