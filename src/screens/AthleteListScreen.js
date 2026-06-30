import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet, View, Text, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAthletes, removeAthlete } from '../redux/athletesSlice';

function AthleteItem({ athlete, eventId, eventName, navigation, onDelete }) {
  return (
    <View style={styles.athleteCard}>
      <View style={{ flex: 1 }}>
        <Text style={styles.athleteName}>{athlete.name}</Text>
        {athlete.bib_number ? <Text style={styles.athleteInfo}>Bib: #{athlete.bib_number}</Text> : null}
        {athlete.age ? <Text style={styles.athleteInfo}>Age: {athlete.age}</Text> : null}
        {athlete.house ? <Text style={styles.athleteHouse}>{athlete.house}</Text> : null}
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          onPress={() => navigation.navigate('EditAthlete', { eventId, athlete, eventName })}
          style={styles.editButton}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDelete(athlete.id, athlete.name)} style={styles.deleteButton}>
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function AthleteListScreen({ route, navigation }) {
  const { eventId, eventName } = route.params;
  const dispatch = useDispatch();
  const { athletes, loading } = useSelector((state) => state.athletes);
  const [searchText, setSearchText] = useState('');
  const [filterHouse, setFilterHouse] = useState('ALL');

  useEffect(() => {
    dispatch(fetchAthletes(eventId));
  }, [eventId]);

  const houses = useMemo(() => [...new Set(athletes.map((a) => a.house).filter(Boolean))], [athletes]);

  const filteredAthletes = useMemo(() => {
    return athletes.filter((a) => {
      const matchesSearch = a.name.toLowerCase().includes(searchText.toLowerCase());
      const matchesHouse = filterHouse === 'ALL' || a.house === filterHouse;
      return matchesSearch && matchesHouse;
    });
  }, [athletes, searchText, filterHouse]);

  const handleDelete = (athleteId, athleteName) => {
    Alert.alert('Delete Athlete', `Remove ${athleteName}?`, [
      { text: 'Cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          dispatch(removeAthlete(athleteId)).unwrap()
            .then(() => Alert.alert('Success', 'Athlete deleted'))
            .catch(() => Alert.alert('Error', 'Failed to delete athlete'));
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{eventName}</Text>
        <Text style={styles.headerSubtitle}>Athletes ({filteredAthletes.length})</Text>
        <TouchableOpacity
          style={styles.resultsLink}
          onPress={() => navigation.navigate('ResultsEntry', { eventId, eventName })}
        >
          <Text style={styles.resultsLinkText}>🏁 Enter Results</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput style={styles.searchInput} placeholder="Search athletes..." value={searchText} onChangeText={setSearchText} />
      </View>

      {houses.length > 0 && (
        <View style={styles.filterContainer}>
          <TouchableOpacity style={[styles.filterChip, filterHouse === 'ALL' && styles.filterChipActive]} onPress={() => setFilterHouse('ALL')}>
            <Text style={[styles.filterChipText, filterHouse === 'ALL' && styles.filterChipTextActive]}>All</Text>
          </TouchableOpacity>
          {houses.map((house) => (
            <TouchableOpacity key={house} style={[styles.filterChip, filterHouse === house && styles.filterChipActive]} onPress={() => setFilterHouse(house)}>
              <Text style={[styles.filterChipText, filterHouse === house && styles.filterChipTextActive]}>{house}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#1F4788" style={{ marginTop: 30 }} />
      ) : (
        <FlatList
          data={filteredAthletes}
          renderItem={({ item }) => (
            <AthleteItem athlete={item} eventId={eventId} eventName={eventName} navigation={navigation} onDelete={handleDelete} />
          )}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={() => dispatch(fetchAthletes(eventId))} />}
          ListEmptyComponent={<Text style={styles.emptyText}>No athletes found</Text>}
        />
      )}

      <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddAthlete', { eventId, eventName })}>
        <Text style={styles.addButtonText}>+ Add Athlete</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  headerSubtitle: { fontSize: 14, color: '#666', marginTop: 4 },
  resultsLink: { marginTop: 10, alignSelf: 'flex-start' },
  resultsLinkText: { fontSize: 13, fontWeight: '700', color: '#1F4788' },
  searchContainer: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#fff' },
  searchInput: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  filterContainer: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#fff', gap: 8 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#E0E0E0' },
  filterChipActive: { backgroundColor: '#1F4788', borderColor: '#1F4788' },
  filterChipText: { fontSize: 12, color: '#666', fontWeight: '600' },
  filterChipTextActive: { color: '#fff' },
  athleteCard: { flexDirection: 'row', marginHorizontal: 20, marginVertical: 8, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#fff', borderRadius: 8 },
  athleteName: { fontSize: 14, fontWeight: '600', color: '#333' },
  athleteInfo: { fontSize: 12, color: '#666', marginTop: 2 },
  athleteHouse: { fontSize: 11, color: '#1F4788', fontWeight: '600', marginTop: 4 },
  actions: { flexDirection: 'row', gap: 8 },
  editButton: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#1F4788', borderRadius: 4 },
  editButtonText: { fontSize: 11, color: '#fff', fontWeight: '600' },
  deleteButton: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#E74C3C', borderRadius: 4 },
  deleteButtonText: { fontSize: 11, color: '#fff', fontWeight: '600' },
  addButton: { marginHorizontal: 20, marginVertical: 16, paddingVertical: 12, backgroundColor: '#1F4788', borderRadius: 8, alignItems: 'center' },
  addButtonText: { fontSize: 14, color: '#fff', fontWeight: 'bold' },
  emptyText: { textAlign: 'center', color: '#999', fontSize: 14, marginTop: 30 },
});
