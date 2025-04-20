from firebase_admin import auth

def list_all_users():
    # Get users in batches
    page = auth.list_users()
    for user in page.iterate_all():
        print('User: ', {
            'uid': user.uid,
            'email': user.email,
            'display_name': user.display_name
        })