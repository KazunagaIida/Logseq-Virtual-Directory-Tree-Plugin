import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/preact';
import { CreatePageDialog } from '../../components/CreatePageDialog';

describe('CreatePageDialog', () => {
  it('calls onConfirm with full page name when submitted', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const { getByPlaceholderText, getByText } = render(
      <CreatePageDialog folderPrefix="dev" onConfirm={onConfirm} onCancel={onCancel} />,
    );

    const input = getByPlaceholderText('Page name');
    fireEvent.input(input, { target: { value: 'hooks' } });
    fireEvent.click(getByText('Create'));

    expect(onConfirm).toHaveBeenCalledWith('dev/hooks');
  });

  it('calls onConfirm with name only when no prefix', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const { getByPlaceholderText, getByText } = render(
      <CreatePageDialog folderPrefix="" onConfirm={onConfirm} onCancel={onCancel} />,
    );

    const input = getByPlaceholderText('Page name');
    fireEvent.input(input, { target: { value: 'newpage' } });
    fireEvent.click(getByText('Create'));

    expect(onConfirm).toHaveBeenCalledWith('newpage');
  });

  it('shows error for empty name', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const { getByText } = render(
      <CreatePageDialog folderPrefix="" onConfirm={onConfirm} onCancel={onCancel} />,
    );

    fireEvent.click(getByText('Create'));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(getByText('Page name cannot be empty')).toBeTruthy();
  });

  it('shows error for invalid characters', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const { getByPlaceholderText, getByText } = render(
      <CreatePageDialog folderPrefix="" onConfirm={onConfirm} onCancel={onCancel} />,
    );

    const input = getByPlaceholderText('Page name');
    fireEvent.input(input, { target: { value: 'bad[name]' } });
    fireEvent.click(getByText('Create'));

    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('calls onCancel when Cancel is clicked', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const { getByText } = render(
      <CreatePageDialog folderPrefix="" onConfirm={onConfirm} onCancel={onCancel} />,
    );

    fireEvent.click(getByText('Cancel'));

    expect(onCancel).toHaveBeenCalled();
  });

  it('submits on Enter key', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const { getByPlaceholderText } = render(
      <CreatePageDialog folderPrefix="" onConfirm={onConfirm} onCancel={onCancel} />,
    );

    const input = getByPlaceholderText('Page name');
    fireEvent.input(input, { target: { value: 'mypage' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onConfirm).toHaveBeenCalledWith('mypage');
  });

  it('cancels on Escape key', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const { getByPlaceholderText } = render(
      <CreatePageDialog folderPrefix="" onConfirm={onConfirm} onCancel={onCancel} />,
    );

    const input = getByPlaceholderText('Page name');
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(onCancel).toHaveBeenCalled();
  });
});
