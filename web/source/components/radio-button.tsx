// source/components/radio-button.tsx
// Defines and exports a radio button component.

/**
 * A radio button.
 *
 * @prop {string} id - An ID to refer to the button in tests.
 * @prop {string} text - The text to display on the button.
 * @prop {boolean} selected - Whether or not the option is currently selected.
 * @prop {Function} action - The function to call on clicking the button.
 *
 * @component
 */
export const RadioButton = (props: {
	id: string
	text: string
	selected: boolean
	action: () => void
	class?: string
}) => (
	<div
		onClick={() => {
			if (typeof props.action === 'function') props.action()
		}}
	>
		<input
			id={props.id}
			name={props.id}
			checked={props.selected}
			type="radio"
			class="w-3 h-3 dark:border-background-dark bg-surface dark:bg-surface-dark text-on-surface dark:text-on-surface-dark focus:outline-none focus:ring-primary dark:focus:ring-primary-dark focus:border-primary dark:focus:border-primary-dark focus:z-10"
		/>
		<label
			class={`ml-2 text-md font-normal ${props.class}`}
			dangerouslySetInnerHTML={{
				__html: props.text,
			}}
		/>
	</div>
)
