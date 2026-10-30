import { Component, type ReactNode } from 'react';
import { ErrorState } from '@/modules/shared/ui/ErrorState';

type State = { failed: boolean };

/** Keeps one widget's render crash from blanking Home; the member can retry just that card. */
export class WidgetBoundary extends Component<{ children: ReactNode; name: string }, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <ErrorState
          body="Something went wrong showing this section."
          compact
          onRetry={() => this.setState({ failed: false })}
          title={`${this.props.name} unavailable`}
        />
      );
    }
    return this.props.children;
  }
}
