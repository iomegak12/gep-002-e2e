import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardBody } from '@/components/primitives/Card';
import { Button } from '@/components/primitives/Button';
import { cn } from '@/lib/cn';

/**
 * Generic multi-step form driven by react-hook-form.
 *
 * Props:
 *  - steps: [{ id, label, fields?, render(form) }]
 *      - `fields` is an array of dotted field names this step owns;
 *        `next()` validates only those paths.
 *      - `render` receives the RHF form instance; FormProvider is
 *        installed so step bodies may also call useFormContext().
 *  - schema: a single Zod schema for the whole form (used as resolver).
 *  - defaultValues: object — initial form state.
 *  - onSubmit(values): submit handler on the last step.
 *  - submitLabel: label on the final step's submit button.
 *  - aside: optional right-rail content.
 */
export function Wizard({ steps, schema, defaultValues, onSubmit, submitLabel = 'Submit', aside }) {
  const [index, setIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const current = steps[index];

  const form = useForm({
    mode: 'onBlur',
    defaultValues,
    resolver: schema ? zodResolver(schema) : undefined,
  });

  async function next() {
    const ok = current.fields?.length
      ? await form.trigger(current.fields)
      : await form.trigger();
    if (!ok) return;
    setIndex((i) => Math.min(i + 1, steps.length - 1));
  }
  function back() {
    setIndex((i) => Math.max(i - 1, 0));
  }
  async function submit() {
    const ok = await form.trigger();
    if (!ok) return;
    setSubmitting(true);
    try {
      await onSubmit?.(form.getValues());
    } finally {
      setSubmitting(false);
    }
  }

  const isLast = index === steps.length - 1;

  return (
    <FormProvider {...form}>
      <div className="grid grid-cols-1 gap-widget-gap lg:grid-cols-3">
        <div className="flex flex-col gap-widget-gap lg:col-span-2">
          {/* Stepper */}
          <ol className="flex items-center gap-3 overflow-x-auto rounded-2xl border border-outline-variant bg-surface-container-low p-3">
            {steps.map((s, i) => {
              const done = i < index;
              const active = i === index;
              return (
                <li key={s.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => (done ? setIndex(i) : null)}
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-full border text-body-sm font-semibold',
                      active
                        ? 'border-primary bg-primary text-on-primary'
                        : done
                          ? 'border-primary bg-primary-container text-on-primary-container'
                          : 'border-outline-variant bg-surface text-on-surface-variant'
                    )}
                  >
                    {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </button>
                  <span
                    className={cn(
                      'whitespace-nowrap text-body-sm',
                      active ? 'text-on-surface' : 'text-on-surface-variant'
                    )}
                  >
                    {s.label}
                  </span>
                  {i < steps.length - 1 ? (
                    <span className="mx-1 h-px w-6 bg-outline-variant" aria-hidden />
                  ) : null}
                </li>
              );
            })}
          </ol>

          <Card>
            <CardBody>{current.render?.(form)}</CardBody>
          </Card>

          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={back}
              disabled={index === 0 || submitting}
              leftIcon={<ChevronLeft className="h-4 w-4" />}
            >
              Back
            </Button>
            {!isLast ? (
              <Button
                variant="primary"
                onClick={next}
                rightIcon={<ChevronRight className="h-4 w-4" />}
              >
                Next
              </Button>
            ) : (
              <Button variant="primary" onClick={submit} disabled={submitting}>
                {submitting ? 'Submitting…' : submitLabel}
              </Button>
            )}
          </div>
        </div>

        {aside ? <div className="flex flex-col gap-widget-gap">{aside}</div> : null}
      </div>
    </FormProvider>
  );
}
