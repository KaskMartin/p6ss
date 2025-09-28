// Database Types
// These types represent the structure of data from the database

export interface User {
  id: number
  email: string
  name: string | null
  is_admin: boolean
  created_at: string
  updated_at: string
}

export interface Group {
  id: number
  name: string
  description: string | null
  created_by: number
  public_link: boolean
  link_uid: string | null
  created_at: string
  updated_at: string
}

export interface GroupWithRole extends Group {
  joined_at?: string
  role_name?: string
  permissions?: string
}

export interface Member {
  id: number
  email: string
  name: string | null
  is_admin: boolean
  joined_at: string
  need_admin_approve: boolean
  role_name: string | null
  permissions: string | null
}

export interface GroupData {
  group: Group
  members: Member[]
  userRole: {
    role_name: string
    permissions: string
  } | null
}

export interface GroupsData {
  userGroups: GroupWithRole[]
  allGroups: Group[]
  isGlobalAdmin: boolean
}

export interface Event {
  id: number
  group_id: number
  created_by: number
  title: string
  subtitle: string | null
  description: string | null
  start_datetime: string
  end_datetime: string
  address: string | null
  location_lat: number | null
  location_lng: number | null
  list_item_picture: string | null
  header_picture: string | null
  background_picture: string | null
  invite_paper_image: string | null
  public_link: boolean
  link_uid: string | null
  messenger_link: string | null
  created_at: string
  updated_at: string
}

export interface EventWithGroup extends Event {
  group_name: string
  created_by_name: string | null
  created_by_email: string
}

export interface PublicEvent {
  id: number
  group_id: number
  created_by: number
  title: string
  subtitle: string | null
  description: string | null
  start_datetime: string
  end_datetime: string
  address: string | null
  location_lat: number | null
  location_lng: number | null
  list_item_picture: string | null
  header_picture: string | null
  background_picture: string | null
  invite_paper_image: string | null
  public_link: boolean
  link_uid: string | null
  messenger_link: string | null
  created_at: string
  updated_at: string
  group_name: string
  created_by_name: string | null
  created_by_email: string
}

export interface Invitation {
  id: number
  group_id: number
  description: string | null
  status: string
  created_at: string
  group_name: string
  group_description: string | null
  invited_by_name: string | null
  invited_by_email: string | null
}

export interface Image {
  id: number
  uid: string
  url: string
  thumb_url: string | null
  width: number | null
  height: number | null
  type: 'list_item' | 'header' | 'background' | 'invite_paper'
  created_at: string
  updated_at: string
}

export interface PublicGroup {
  id: number
  name: string
  description: string | null
  created_by: number
  public_link: boolean
  link_uid: string | null
  created_at: string
  updated_at: string
  creator_name: string | null
}

export interface PublicGroupData {
  group: PublicGroup
  events: PublicEvent[]
}
