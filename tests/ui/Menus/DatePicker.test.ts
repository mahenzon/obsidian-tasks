import { fireEvent } from '@testing-library/svelte';
import moment from 'moment/moment';
import { promptForDate } from 'ui/Menus/DatePicker';
import { withTimezone } from '../../TestingTools/DateTestHelpers';
import { TaskBuilder } from '../../TestingTools/TaskBuilder';
import { TestableTaskSaver } from './MenuTestingHelpers';

window.moment = moment;

function openPicker() {
    const task = new TaskBuilder().dueDate('2024-11-03').build();
    const anchor = document.body.createSpan();
    promptForDate(anchor, task, 'dueDate', TestableTaskSaver.testableTaskSaver);
    return document.querySelector<HTMLInputElement>('input[type="date"]')!;
}

beforeEach(() => TestableTaskSaver.reset());

afterEach(() => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    document.body.replaceChildren();
});

describe('native date picker', () => {
    it.each(['America/Los_Angeles', 'Pacific/Auckland'])('should save the selected calendar date in %s', (timezone) => {
        withTimezone(timezone, () => {
            const input = openPicker();
            expect(input.value).toBe('2024-11-03');

            input.value = '2024-11-04';
            input.dispatchEvent(new Event('change'));

            expect(TestableTaskSaver.tasksBeingSaved?.[0].dueDate).toEqualMoment(moment('2024-11-04'));
            expect(input.isConnected).toBe(false);
        });
    });

    it('should remove a cleared date', async () => {
        const input = openPicker();

        await fireEvent.change(input, { target: { value: '' } });

        expect(TestableTaskSaver.tasksBeingSaved?.[0].dueDate).toBeNull();
        expect(input.isConnected).toBe(false);
    });

    it.each(['Escape', 'outside click'])('should dismiss on %s and reopen without saving', async (dismissal) => {
        const input = openPicker();
        if (dismissal === 'Escape') {
            await fireEvent.keyDown(document, { key: 'Escape' });
        } else {
            await fireEvent.pointerDown(document.body);
        }

        expect(input.isConnected).toBe(false);
        expect(TestableTaskSaver.tasksBeingSaved).toBeUndefined();

        const reopened = openPicker();
        const replacement = openPicker();
        expect(reopened.isConnected).toBe(false);
        expect(replacement.value).toBe('2024-11-03');
        expect(document.querySelectorAll('input[type="date"]')).toHaveLength(1);
        expect(TestableTaskSaver.tasksBeingSaved).toBeUndefined();
    });
});
