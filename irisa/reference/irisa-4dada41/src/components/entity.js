import { getEntityStyle } from '../util';

export default {
  functional: true,

  props: {
    boardSize: { type: Number, required: true },
    className: { type: String, required: true },
    isDisabled: { type: Boolean, required: true },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
  },

  render (createElement, { props }) {
    const { boardSize, className, isDisabled, x, y } = props;

    return createElement('div', {
      'class': {
        'disabled': isDisabled,
        'entity': true,
        [className]: true,
      },
      'style': getEntityStyle(boardSize, x, y),
    });
  },
};
