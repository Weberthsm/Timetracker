import { defineStore } from 'pinia'
import { ref } from 'vue'
import { projectsService, type Project, type ProjectTeam } from '@/services/projects.service'

export const useProjectsStore = defineStore('projects', () => {
  const projects = ref<Project[]>([])
  const currentProject = ref<Project | null>(null)

  async function fetchAll() {
    const res = await projectsService.list({ limit: '1000' })
    const body = (res.data as { data: { data: Project[] } }).data
    projects.value = body.data
  }

  async function fetchOne(id: string) {
    const res = await projectsService.get(id)
    currentProject.value = (res.data as { data: Project }).data
  }

  async function create(data: { name: string; description?: string; color?: string }) {
    const res = await projectsService.create(data)
    const project = (res.data as { data: Project }).data
    projects.value.unshift(project)
    return project
  }

  async function update(id: string, data: Partial<{ name: string; description: string; color: string }>) {
    const res = await projectsService.update(id, data)
    const updated = (res.data as { data: Project }).data
    const idx = projects.value.findIndex((p) => p.id === id)
    if (idx !== -1) projects.value[idx] = updated
    if (currentProject.value?.id === id) currentProject.value = updated
    return updated
  }

  async function archive(id: string) {
    await projectsService.archive(id)
    const idx = projects.value.findIndex((p) => p.id === id)
    if (idx !== -1) projects.value[idx].status = 'archived'
    if (currentProject.value?.id === id) currentProject.value!.status = 'archived'
  }

  async function uploadLogo(id: string, file: File) {
    const res = await projectsService.uploadLogo(id, file)
    const { logoUrl } = (res.data as { data: { logoUrl: string } }).data
    const idx = projects.value.findIndex((p) => p.id === id)
    if (idx !== -1) projects.value[idx].logoUrl = logoUrl
    if (currentProject.value?.id === id) currentProject.value!.logoUrl = logoUrl
    return logoUrl
  }

  async function removeLogo(id: string) {
    await projectsService.removeLogo(id)
    const idx = projects.value.findIndex((p) => p.id === id)
    if (idx !== -1) projects.value[idx].logoUrl = null
    if (currentProject.value?.id === id) currentProject.value!.logoUrl = null
  }

  async function linkTeam(projectId: string, teamId: string, teamName: string) {
    await projectsService.linkTeam(projectId, teamId)
    if (currentProject.value?.id === projectId) {
      const entry: ProjectTeam = { teamId, projectId, team: { id: teamId, name: teamName } }
      currentProject.value = {
        ...currentProject.value,
        teamProjects: [...(currentProject.value.teamProjects ?? []), entry],
      }
    }
  }

  async function unlinkTeam(projectId: string, teamId: string) {
    await projectsService.unlinkTeam(projectId, teamId)
    if (currentProject.value?.id === projectId) {
      currentProject.value = {
        ...currentProject.value,
        teamProjects: (currentProject.value.teamProjects ?? []).filter((tp) => tp.teamId !== teamId),
      }
    }
  }

  return { projects, currentProject, fetchAll, fetchOne, create, update, archive, uploadLogo, removeLogo, linkTeam, unlinkTeam }
})
