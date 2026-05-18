import { defineStore } from 'pinia'
import { ref } from 'vue'
import { teamsService, type Team } from '@/services/teams.service'

export const useTeamsStore = defineStore('teams', () => {
  const teams = ref<Team[]>([])
  const currentTeam = ref<Team | null>(null)

  async function fetchAll() {
    const res = await teamsService.list({ limit: '1000' })
    const body = (res.data as { data: { data: Team[] } }).data
    teams.value = body.data
  }

  async function fetchOne(id: string) {
    const res = await teamsService.get(id)
    currentTeam.value = (res.data as { data: Team }).data
  }

  async function create(data: { name: string }) {
    const res = await teamsService.create(data)
    const team = (res.data as { data: Team }).data
    teams.value.unshift(team)
    return team
  }

  async function update(id: string, data: { name: string }) {
    const res = await teamsService.update(id, data)
    const updated = (res.data as { data: Team }).data
    const idx = teams.value.findIndex((t) => t.id === id)
    if (idx !== -1) teams.value[idx] = updated
    if (currentTeam.value?.id === id) currentTeam.value = updated
  }

  async function deleteTeam(id: string) {
    await teamsService.delete(id)
    teams.value = teams.value.filter((t) => t.id !== id)
  }

  async function addMember(teamId: string, userId: string) {
    await teamsService.addMember(teamId, userId)
    await fetchOne(teamId)
  }

  async function removeMember(teamId: string, userId: string) {
    await teamsService.removeMember(teamId, userId)
    if (currentTeam.value?.id === teamId) {
      currentTeam.value = {
        ...currentTeam.value,
        members: currentTeam.value.members?.filter((m) => m.id !== userId),
      }
    }
  }

  return { teams, currentTeam, fetchAll, fetchOne, create, update, deleteTeam, addMember, removeMember }
})
