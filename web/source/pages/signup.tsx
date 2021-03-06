// source/pages/signup.tsx
// Defines and exports the signup page.

import { useReducer, useState } from 'preact/hooks'
import { route } from 'preact-router'

import {
	Button,
	TextInput,
	Toast,
	LoadingIndicator,
	AuthHeader,
	PageWrapper,
} from '@/components'
import { fetch, isErrorResponse } from '@/utilities/http'
import { errors } from '@/utilities/text'
import { storage } from '@/utilities/storage'
import { isAuthenticated } from '@/utilities/auth'

import type { User, Tokens } from '@/api'

/**
 * The fields that can be filled in the sign up form.
 *
 * @param {string} name - The user's full name.
 * @param {string} email - The user's email address.
 * @param {string} password - The user's password.
 * @param {string} code - The code used to join a group.
 */
interface SignUpForm {
	name: string
	email: string
	password: string
	code: string
}
/**
 * The action that is dispatched to the reducer to update the form's state.
 *
 * @param {'update-field'} type - The type of action to perform.
 * @param {keyof SignUpForm} field - The field which is concerned with the action.
 * @param {string?} payload - The payload, if any.
 */
interface SignUpFormAction {
	type: 'update-field'
	field: keyof SignUpForm
	payload?: string
}

/**
 * The signup page.
 *
 * @page
 */
export const SignUpPage = () => {
	// First and foremost, check that the user is not already signed in. If they
	// are, redirect them to the home page or wherever they wanted to go.
	if (isAuthenticated()) {
		const redirectTo = new URLSearchParams(window.location.search).get(
			'redirect',
		)

		route(redirectTo ?? '/', true)

		return
	}

	/**
	 * The reducer to update the form. The reducer will be called with
	 * the current values of the form, and the action that was dispatched.
	 *
	 * @param {Partial<SignUpForm>} state - The current state of the form.
	 * @param {SignUpFormAction} action - The action to perform.
	 */
	const reducer = (
		state: Partial<SignUpForm>,
		action: SignUpFormAction,
	): Partial<SignUpForm> => {
		// Parse the action, and do something with it.
		switch (action.type) {
			case 'update-field':
				// Check that the payload is not blank.
				if (typeof action.payload === 'undefined') break
				// If not, update the state of the form.
				return {
					...state,
					[action.field]: action.payload,
				}
			default:
				return state
		}

		return state
	}

	// Create the reducer.
	const [signUpForm, dispatch] = useReducer<
		Partial<SignUpForm>,
		SignUpFormAction
	>(reducer, {
		name: undefined,
		email: undefined,
		password: undefined,
	})

	// Define a state if we need to show error messages.
	const passedOnError = new URLSearchParams(window.location.search).get('error')
	const [currentError, setErrorMessage] = useState(
		// @ts-expect-error Yes, expected.
		passedOnError ? errors.get(passedOnError) : undefined,
	)
	// Define a state for the loading indicator too.
	const [isLoading, setLoading] = useState<boolean>(false)

	/**
	 * Create an account for the user.
	 */
	const signUp = async () => {
		// Show the loading indicator.
		setLoading(true)

		// First, validate the form's fields.
		const validation = {
			name: /^(?!\s*$).+/, // Make sure the string isn't blank.
			email: /^\S+@\S+$/, // Make sure the string contains an @.
			password: /^.{6,256}$/, // Make sure the password is longer than 6 chars.
		}

		// Clear the error message.
		setErrorMessage(undefined)
		// Then show a new one, if needed
		if (!validation.name.test(signUpForm.name ?? '')) {
			setLoading(false)
			setErrorMessage(errors.get('incomplete-input'))

			return
		}

		if (!validation.email.test(signUpForm.email ?? '')) {
			setLoading(false)
			setErrorMessage(errors.get('invalid-email-address'))

			return
		}

		if (!validation.password.test(signUpForm.password ?? '')) {
			setLoading(false)
			setErrorMessage(errors.get('weak-password'))

			return
		}

		// If the validation tests pass, then make the API call to create an account.
		const signUpResponse = await fetch<{ user: User; tokens: Tokens }>({
			url: '/auth/signup',
			method: 'post',
			json: signUpForm,
		})

		// Handle any errors that might arise.
		if (isErrorResponse(signUpResponse)) {
			const { error } = signUpResponse

			switch (error.code) {
				case 'improper-payload':
					setErrorMessage(
						error.message.includes('password')
							? errors.get('weak-password')
							: errors.get('invalid-email-address'),
					)
					break
				case 'entity-already-exists':
					setErrorMessage(errors.get('user-already-exists'))
					break
				default:
					setErrorMessage(error.message)
			}

			setLoading(false)
			return
		}

		// Save the user data and tokens in local storage.
		storage.set('user', signUpResponse.user)
		storage.set('tokens', signUpResponse.tokens)

		// Then if the user provided a code, make the join group request.
		if (signUpForm.code) {
			const codeResponse = await fetch({
				url: '/groups/join',
				method: 'put',
				json: { code: signUpForm.code },
			})

			// Handle any errors that might arise.
			if (isErrorResponse(codeResponse)) {
				setErrorMessage(codeResponse.error.message)
				// The most probable error message is that the code doesn't exist, so
				// redirect the user to the groups page where they caan retry joining.
				setTimeout(() => route('/groups', true), 2500)

				return
			}
		}

		// Then route the user to the home page or whatever page they want to go to.
		const redirectTo = new URLSearchParams(window.location.search).get(
			'redirect',
		)
		setLoading(false)
		route(redirectTo ?? '/', true)
	}

	return (
		<PageWrapper>
			<div class="flex items-center justify-center py-12">
				<div class="max-w-md w-full space-y-8">
					<AuthHeader mode="signup" />
					<div class="shadow overflow-hidden rounded-lg dark:bg-background-dark">
						<div class="m-2 px-5 py-5">
							<form class="space-y-6">
								<TextInput
									id="name-input"
									label="Name"
									type="name"
									placeholder="Full Name"
									value={signUpForm.name}
									required={true}
									update={(value: string) =>
										dispatch({
											type: 'update-field',
											field: 'name',
											payload: value,
										})
									}
								/>
								<TextInput
									id="email-input"
									label="Email address"
									type="email"
									placeholder="name@email.com"
									value={signUpForm.email}
									required={true}
									update={(value: string) =>
										dispatch({
											type: 'update-field',
											field: 'email',
											payload: value,
										})
									}
								/>
								<TextInput
									id="password-input"
									label="Password"
									type="password"
									placeholder="correcthorsebatterystaple"
									value={signUpForm.password}
									required={true}
									update={(value: string) =>
										dispatch({
											type: 'update-field',
											field: 'password',
											payload: value,
										})
									}
								/>
								<TextInput
									id="code-input"
									label="Code"
									type="code"
									placeholder="code-to-join-a-group"
									value={signUpForm.code}
									required={false}
									update={(value: string) =>
										dispatch({
											type: 'update-field',
											field: 'code',
											payload: value,
										})
									}
								/>
								<Button
									id="signup-button"
									text="Sign Up"
									action={signUp}
									type="filled"
									class={isLoading ? 'hidden' : 'w-full'}
								/>
								<LoadingIndicator isLoading={isLoading} />
							</form>
						</div>
					</div>
					<Toast id="error-message" type="error" text={currentError} />
				</div>
			</div>
		</PageWrapper>
	)
}
