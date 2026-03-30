import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/preact';
import { App } from '../../components/App';

describe('App: createPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (logseq.Editor.getAllPages as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (logseq.Editor.getCurrentPage as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (logseq.Editor.createPage as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
  });

  it('calls createPage with createFirstBlock: true', async () => {
    const { getByTestId, getByPlaceholderText, getByText } = render(<App />);

    // Open the create page dialog
    const createBtn = getByTestId('create-btn');
    fireEvent.click(createBtn);

    // Fill in the page name and submit
    const input = getByPlaceholderText('Page name');
    fireEvent.input(input, { target: { value: 'testpage' } });
    fireEvent.click(getByText('Create'));

    await waitFor(() => {
      expect(logseq.Editor.createPage).toHaveBeenCalledWith('testpage');
      expect(logseq.Editor.appendBlockInPage).toHaveBeenCalledWith('testpage', '');
    });

    expect(logseq.App.pushState).toHaveBeenCalledWith('page', { name: 'testpage' });
  });
});
