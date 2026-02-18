export function getPackage(packageOrOrgId, kmId = null, version = null) {
    let organizationId;
    if (!kmId || !version) {
        [organizationId, kmId, version] = packageOrOrgId.split(":");
    } else {
        organizationId = packageOrOrgId;
    }

    return cy
        .task('knowledgeModelPackage:get', {
            organization_id: organizationId,
            km_id: kmId,
            version,
        })
}

export function getPackageUuid(packageOrOrgId, kmId = null, version = null) {
    return getPackage(packageOrOrgId, kmId, version).then(pkg => pkg.uuid)
}
