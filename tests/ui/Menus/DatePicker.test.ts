import moment from 'moment/moment';
import { promptForDate } from 'ui/Menus/DatePicker';
import { withTimezone } from '../../TestingTools/DateTestHelpers';
import { TaskBuilder } from '../../TestingTools/TaskBuilder';
import { TestableTaskSaver } from './MenuTestingHelpers';

window.moment = moment;

function openPicker() {
    const task = new TaskBuilder().dueDate('2024-11-03').build();
    promptForDate(document.body.createSpan(), task, 'dueDate', TestableTaskSaver.testableTaskSaver);
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

    it('should remove a cleared date', () => {
        const input = openPicker();

        input.value = '';
        input.dispatchEvent(new Event('change'));

        expect(TestableTaskSaver.tasksBeingSaved?.[0].dueDate).toBeNull();
        expect(input.isConnected).toBe(false);
    });

    it.each([
        { name: 'Escape', event: new KeyboardEvent('keydown', { key: 'Escape' }) },
        { name: 'outside click', event: new Event('pointerdown') },
    ])('should dismiss on $name and reopen without saving', ({ event }) => {
        const input = openPicker();
        document.body.dispatchEvent(event);

        expect(input.isConnected).toBe(false);

        const reopened = openPicker();
        reopened.dispatchEvent(new Event('pointerdown', { bubbles: true }));
        expect(reopened.isConnected).toBe(true);
        const replacement = openPicker();
        expect(reopened.isConnected).toBe(false);
        expect(replacement.value).toBe('2024-11-03');
        expect(document.querySelectorAll('input[type="date"]')).toHaveLength(1);
        expect(TestableTaskSaver.tasksBeingSaved).toBeUndefined();
    });
});
