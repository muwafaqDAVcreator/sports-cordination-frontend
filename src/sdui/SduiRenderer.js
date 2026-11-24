import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { registry } from './registry';
import { renderableComponents, resolveBinding } from '../logic/sdui';
import { colors } from '../theme';

/** Catches a misbehaving component so one bad schema node cannot blank the dashboard. */
class ComponentBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * Renders an SDUI schema against the component registry. Each component's
 * data binding is resolved against the local database context first, so a
 * cached layout still shows current local numbers while offline.
 */
export default function SduiRenderer({ schema, context, onAction }) {
  const components = useMemo(() => renderableComponents(schema, registry), [schema]);

  if (!components.length) {
    return <Text style={styles.empty}>Dashboard layout unavailable.</Text>;
  }

  return (
    <View>
      {components.map((component) => {
        const Component = registry[component.type];
        return (
          <ComponentBoundary key={component.id || component.type}>
            <Component
              props={component.props || {}}
              value={resolveBinding(component, context)}
              onAction={onAction}
            />
          </ComponentBoundary>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { textAlign: 'center', color: colors.muted, padding: 24 },
});
