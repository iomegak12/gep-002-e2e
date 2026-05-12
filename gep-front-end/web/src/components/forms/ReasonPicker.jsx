import { useEffect, useState } from 'react';
import { Chip } from '@/components/primitives/Chip';
import { Textarea } from '@/components/primitives/Textarea';
import { Field } from '@/components/primitives/Field';
import { OTHER_REASON_LABEL } from '@/constants/reasons';

/**
 * Renders predefined reason chips. Choosing one reports its label.
 * Choosing "Other" reveals a textarea and reports the typed value.
 */
export function ReasonPicker({ chips = [], value, onChange, otherLabel = OTHER_REASON_LABEL }) {
  const [selected, setSelected] = useState(() => {
    if (!value) return null;
    return chips.includes(value) ? value : otherLabel;
  });
  const [other, setOther] = useState(() => (selected === otherLabel ? value || '' : ''));

  useEffect(() => {
    if (selected === otherLabel) onChange?.(other);
    else onChange?.(selected || '');
  }, [selected, other]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {chips.map((c) => (
          <Chip key={c} selected={selected === c} onClick={() => setSelected(c)}>
            {c}
          </Chip>
        ))}
        <Chip selected={selected === otherLabel} onClick={() => setSelected(otherLabel)}>
          {otherLabel}
        </Chip>
      </div>
      {selected === otherLabel ? (
        <Field label="Describe the reason" required>
          {({ id, invalid }) => (
            <Textarea
              id={id}
              invalid={invalid}
              value={other}
              onChange={(e) => setOther(e.target.value)}
              placeholder="Provide a brief reason…"
              rows={3}
            />
          )}
        </Field>
      ) : null}
    </div>
  );
}
