export function getDocumentTemplate(packageOrOrgId, templateId = null, version = null) {
    let organizationId;
    if (!templateId || !version) {
        [organizationId, templateId, version] = packageOrOrgId.split(":");
    } else {
        organizationId = packageOrOrgId;
    }

    return cy
        .task('documentTemplate:get', {
            organization_id: organizationId,
            template_id: templateId,
            version,
        })
}

export function getDocumentTemplateUuid(packageOrOrgId, templateId = null, version = null) {
    return getDocumentTemplate(packageOrOrgId, templateId, version).then(dt => dt?.uuid)
}
