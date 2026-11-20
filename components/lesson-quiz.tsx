"use client";

import { useState } from "react";
import type { LessonQuestion } from "@/lib/lessons/beginner";

type LessonQuizProps = {
  questions: LessonQuestion[];
};

export function LessonQuiz({ questions }: LessonQuizProps) {
  const [answers, setAnswers] = useState<Array<number | undefined>>(
    () => questions.map(() => undefined),
  );
  const answeredCount = answers.filter((answer) => answer !== undefined).length;
  const score = answers.reduce<number>(
    (total, answer, index) => total + (answer === questions[index].answer ? 1 : 0),
    0,
  );

  function chooseAnswer(questionIndex: number, answerIndex: number) {
    setAnswers((current) =>
      current.map((answer, index) =>
        index === questionIndex && answer === undefined ? answerIndex : answer,
      ),
    );
  }

  return (
    <section className="lesson-quiz" aria-labelledby="knowledge-check">
      <span className="content-kicker">Quick knowledge check</span>
      <h2 id="knowledge-check">Test what you have learned</h2>
      {questions.map((question, questionIndex) => {
        const selectedAnswer = answers[questionIndex];

        return (
          <fieldset className="quiz-question" key={question.prompt}>
            <legend>{questionIndex + 1}. {question.prompt}</legend>
            <div className="quiz-options">
              {question.options.map((option, answerIndex) => (
                <button
                  aria-pressed={selectedAnswer === answerIndex}
                  className={`quiz-option${selectedAnswer === answerIndex ? " selected" : ""}`}
                  disabled={selectedAnswer !== undefined}
                  key={option}
                  onClick={() => chooseAnswer(questionIndex, answerIndex)}
                  type="button"
                >
                  {option}
                </button>
              ))}
            </div>
            {selectedAnswer !== undefined && (
              <p className={selectedAnswer === question.answer ? "quiz-feedback correct" : "quiz-feedback"}>
                {selectedAnswer === question.answer ? "Correct. " : "Not quite. "}
                {question.explanation}
              </p>
            )}
          </fieldset>
        );
      })}
      <div className="quiz-summary" aria-live="polite">
        {answeredCount === questions.length
          ? `You scored ${score} out of ${questions.length}.`
          : `${answeredCount} of ${questions.length} questions answered.`}
        {answeredCount === questions.length && (
          <button
            className="quiz-retry"
            onClick={() => setAnswers(questions.map(() => undefined))}
            type="button"
          >
            Try again
          </button>
        )}
      </div>
    </section>
  );
}
