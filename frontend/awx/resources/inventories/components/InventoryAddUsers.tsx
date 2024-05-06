import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import {
  LoadingPage,
  PageHeader,
  PageLayout,
  PageWizard,
  PageWizardStep,
  useGetPageUrl,
  usePageNavigate,
} from '../../../../../framework';
import { AwxSelectUsersStep } from '../../../access/common/AwxRolesWizardSteps/AwxSelectUsersStep';
import { AwxSelectRolesStep } from '../../../access/common/AwxRolesWizardSteps/AwxSelectRolesStep';
import { AwxRoute } from '../../../main/AwxRoutes';
import { Inventory } from '../../../interfaces/Inventory';
import { useGet } from '../../../../common/crud/useGet';
import { postRequest } from '../../../../common/crud/Data';
import { AwxUser } from '../../../interfaces/User';
import { RoleAssignmentsReviewStep } from '../../../../common/access/RolesWizard/steps/RoleAssignmentsReviewStep';
import { AwxRbacRole } from '../../../interfaces/AwxRbacRole';
import { useAwxBulkActionDialog } from '../../../common/useAwxBulkActionDialog';
import { awxAPI } from '../../../common/api/awx-utils';

interface WizardFormValues {
  users: AwxUser[];
  awxRoles: AwxRbacRole[];
}

interface UserRolePair {
  user: AwxUser;
  role: AwxRbacRole;
}

export function InventoryAddUsers() {
  const { t } = useTranslation();
  const getPageUrl = useGetPageUrl();
  const params = useParams<{ id: string }>();

  const { data: inventory, isLoading } = useGet<Inventory>(
    awxAPI`/inventories/${params.id ?? ''}/`
  );
  const userProgressDialog = useAwxBulkActionDialog<UserRolePair>();
  const pageNavigate = usePageNavigate();

  if (isLoading || !inventory) return <LoadingPage />;

  const steps: PageWizardStep[] = [
    {
      id: 'users',
      label: t('Select user(s)'),
      inputs: (
        <AwxSelectUsersStep
          descriptionForUsersSelection={t(
            'Select the user(s) that you want to give access to {{inventoryName}}.',
            {
              inventoryName: inventory?.name,
            }
          )}
        />
      ),
      validate: (formData, _) => {
        const { users } = formData as { users: AwxUser[] };
        if (!users?.length) {
          throw new Error(t('Select at least one user.'));
        }
      },
    },
    {
      id: 'awxRoles',
      label: t('Select roles to apply'),
      inputs: (
        <AwxSelectRolesStep
          contentType="inventory"
          fieldNameForPreviousStep="users"
          descriptionForRoleSelection={t('Choose roles to apply to {{inventoryName}}.', {
            inventoryName: inventory?.name,
          })}
        />
      ),
      validate: (formData, _) => {
        const { awxRoles } = formData as { awxRoles: AwxRbacRole[] };
        if (!awxRoles?.length) {
          throw new Error(t('Select at least one role.'));
        }
      },
    },
    {
      id: 'review',
      label: t('Review'),
      inputs: <RoleAssignmentsReviewStep />,
    },
  ];

  const onSubmit = (data: WizardFormValues) => {
    const { users, awxRoles } = data;
    const items: UserRolePair[] = [];
    for (const user of users) {
      for (const role of awxRoles) {
        items.push({ user, role });
      }
    }
    return new Promise<void>((resolve) => {
      userProgressDialog({
        title: t('Add roles'),
        keyFn: ({ user, role }) => `${user.id}_${role.id}`,
        items,
        actionColumns: [
          { header: t('User'), cell: ({ user }) => user.username },
          { header: t('Role'), cell: ({ role }) => role.name },
        ],
        actionFn: ({ user, role }) =>
          postRequest(awxAPI`/role_user_assignments/`, {
            user: user.id,
            role_definition: role.id,
            content_type: 'awx.inventory',
            object_id: inventory.id,
          }),
        onComplete: () => {
          resolve();
        },
        onClose: () => {
          pageNavigate(AwxRoute.InventoryUserAccess, {
            params: { id: inventory.id.toString() },
          });
        },
      });
    });
  };

  return (
    <PageLayout>
      <PageHeader
        title={t('Add roles')}
        breadcrumbs={[
          { label: t('Inventories'), to: getPageUrl(AwxRoute.Inventories) },
          {
            label: inventory?.name,
            to: getPageUrl(AwxRoute.InventoryDetails, { params: { id: inventory?.id } }),
          },
          {
            label: t('User Access'),
            to: getPageUrl(AwxRoute.InventoryUserAccess, { params: { id: inventory?.id } }),
          },
          { label: t('Add roles') },
        ]}
      />
      <PageWizard<WizardFormValues>
        steps={steps}
        onSubmit={onSubmit}
        disableGrid
        onCancel={() => {
          pageNavigate(AwxRoute.InventoryUserAccess, { params: { id: inventory?.id } });
        }}
      />
    </PageLayout>
  );
}
