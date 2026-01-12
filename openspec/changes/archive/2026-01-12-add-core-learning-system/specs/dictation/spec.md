## ADDED Requirements

### Requirement: Audio Dictation Exercise
The system SHALL provide dictation exercises where Cantonese audio is played and learners input the correct Traditional character(s).

#### Scenario: Audio dictation flow
- **WHEN** learner starts an audio dictation exercise
- **THEN** Cantonese audio is played, and the learner is prompted to input the correct Traditional character(s)

#### Scenario: Audio dictation feedback
- **WHEN** learner submits their answer after hearing audio
- **THEN** the system provides immediate feedback indicating whether the answer is correct or incorrect

### Requirement: Image Dictation Exercise
The system SHALL provide dictation exercises where a picture linked to a target character or word is shown, optionally with Cantonese pronunciation, and learners input the correct Traditional character(s).

#### Scenario: Image dictation flow
- **WHEN** learner starts an image dictation exercise
- **THEN** a picture is displayed, optional audio is played, and the learner is prompted to input the correct Traditional character(s)

#### Scenario: Image dictation with audio
- **WHEN** learner views an image dictation exercise
- **THEN** the system optionally plays the Cantonese pronunciation of the target character/word

### Requirement: Correctness Checking
The system SHALL compare learner input to the correct answer and provide immediate feedback.

#### Scenario: Correct answer
- **WHEN** learner inputs the correct Traditional character(s)
- **THEN** the system indicates success and may show additional information about the character

#### Scenario: Incorrect answer
- **WHEN** learner inputs incorrect character(s)
- **THEN** the system indicates the answer is incorrect and shows the correct answer

### Requirement: Answer Display
The system SHALL display the correct answer after learner submission, showing the Traditional character(s) and optionally Jyutping.

#### Scenario: Show correct answer
- **WHEN** learner submits an answer (correct or incorrect)
- **THEN** the system displays the correct Traditional character(s) and Jyutping pronunciation

### Requirement: Exercise Variety
The system SHALL support dictation exercises for individual characters, words, and short sentences.

#### Scenario: Character dictation
- **WHEN** generating a character-level dictation exercise
- **THEN** audio or image prompts for a single character

#### Scenario: Sentence dictation
- **WHEN** generating a sentence-level dictation exercise
- **THEN** audio or image prompts for multiple characters forming a sentence
