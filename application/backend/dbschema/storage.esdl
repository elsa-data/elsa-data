module storage {

    scalar type ChecksumType extending enum<'MD5', 'AWS_ETAG', 'SHA_1', 'SHA_256'>;

    type File {
        required property url -> str {
            readonly := true;

            constraint exclusive on (str_lower(__subject__));

            # look this isn't really going to catch much - but in reality URLs aren't urls if they
            # are less than 6 characters - maybe replace with weak regex

            constraint min_len_value(5);
        }

        required property size -> int64;

        required property checksums -> array<tuple<type: ChecksumType, value: str>>;
    }
}
